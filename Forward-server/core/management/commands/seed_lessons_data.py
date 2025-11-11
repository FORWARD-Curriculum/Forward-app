# core/management/commands/seed_lesson.py
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import boto3  # pyright: ignore[reportMissingImports]
from django.conf import settings
from django.core.files import File
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
from django.db import IntegrityError, transaction

from core.models import (
    ActivityManager,
    BaseActivity,
    Concept,
    ConceptMap,
    Lesson,
    PollQuestion,
    Question,
    Slideshow,
    Slide,
)


class Command(BaseCommand):
    help = "Seeds the database with lesson data from a JSON file using ActivityManager"

    # ---------- CLI ----------
    def add_arguments(self, parser):
        parser.add_argument(
            "json_file",
            type=str,
            help="Path to the JSON seed file relative to BASE_DIR/core/management/seed_data/lesson_data",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing data (matching lesson title) before seeding",
        )

    # ---------- Entry ----------
    def handle(self, *args, **options):
        json_file_path = (
            Path(settings.BASE_DIR)
            / "core"
            / "management"
            / "seed_data"
            / "lesson_data"
            / options["json_file"]
        )
        self.folder_path = json_file_path.parent
        activity_manager = ActivityManager()

        data = self._load_json(json_file_path)
        if data is None:
            return

        lesson_payload = data.get("lesson", {})
        lesson_title = lesson_payload.get("title")
        if not lesson_title:
            self._err('JSON must contain "lesson" with a "title".')
            return

        try:
            with transaction.atomic():
                if options["reset"]:
                    self._warn("Resetting data for this lesson...")
                    self._delete_existing_data(lesson_title, activity_manager)

                lesson = self._create_or_update_lesson(lesson_payload)
                activities = data.get("activities", [])
                self._create_activities(lesson, activities, activity_manager)

                self._ok(f"Successfully seeded lesson: {lesson.title}")
        except IntegrityError as e:
            self._err(
                f"Database integrity error: {str(e)}. Perhaps run with --reset?"
            )
        except Exception as e:
            self._err(f"Error seeding database: {str(e)}")
            import traceback

            traceback.print_exc()
            raise

    # ---------- JSON ----------
    def _load_json(self, path: Path) -> Optional[dict]:
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            self._err(f"File not found: {path}")
        except json.JSONDecodeError:
            self._err(f"Invalid JSON in file: {path}")
        return None

    # ---------- Delete ----------
    def _delete_existing_data(self, lesson_title: str, manager: ActivityManager):
        lesson = Lesson.objects.filter(title=lesson_title).first()
        if not lesson:
            self._log(f"Lesson '{lesson_title}' not found, skipping deletion.")
            return

        self._log(
            f"Deleting activities for lesson: {lesson_title} (ID: {lesson.id})"
        )

        for key, (Model, _, __, is_child, ___) in manager.registered_activities.items():
            if is_child:
                continue
            # Questions/PollQuestions cascade via their parents
            if key in ["question", "pollquestion"]:
                continue
            if hasattr(Model, "lesson"):
                deleted, _ = Model.objects.filter(lesson=lesson).delete()
                if deleted:
                    self._log(f"  Deleted {deleted} {Model.__name__} objects.")

        lesson.delete()
        self._log(f"Deleted lesson: {lesson_title}")

    # ---------- Lesson ----------
    def _create_or_update_lesson(self, payload: dict) -> Lesson:
        payload = payload.copy()
        image_filename = payload.pop("image", None)

        lesson, created = Lesson.objects.update_or_create(
            title=payload.get("title"),
            active=True,
            defaults=payload,
        )

        if image_filename:
            self._save_model_file(
                instance=lesson,
                field_name="image",
                rel_path=self.folder_path / image_filename,
                label="Lesson image",
            )

        self._log(f"{'Created' if created else 'Updated'} lesson: {lesson.title}")
        return lesson

    # ---------- Activities ----------
    def _create_activities(
        self, lesson: Lesson, activities: List[dict], manager: ActivityManager
    ):
        for order, raw in enumerate(activities, start=1):
            act = raw.copy()
            act_type = (act.pop("type", "") or "").lower()

            if not act_type or act_type not in manager.registered_activities:
                self._warn(
                    f"Skipping activity at position {order}: invalid type '{act_type}'"
                )
                continue

            ActivityModel, _, __, is_child, ___ = manager.registered_activities[
                act_type
            ]
            if is_child:
                # top-level only
                continue

            # Extract children payloads before building defaults
            questions = act.pop("questions", None) if act_type in {"quiz", "poll"} else None
            concepts = act.pop("examples", None) if act_type == "conceptmap" else None
            slides = act.pop("slides", None) if act_type == "slideshow" else None

            # Build defaults
            defaults = {
                "title": act.pop("title", f"{act_type.capitalize()} Activity {order}"),
                "instructions": act.pop("instructions", None),
                **act,
            }

            # File hints from payload (removed from defaults; handled post-create)
            image_name = (
                defaults.pop("image", None)
                if act_type in {"textcontent", "fillintheblank", "quiz"}
                else None
            )
            video_name = defaults.pop("video", None) if act_type == "video" else None
            twine_name = defaults.pop("file", None) if act_type == "twine" else None

            # Special case: TextContent image referenced in content like ![alt](path)
            if act_type == "textcontent" and not image_name:
                content = str(defaults.get("content", "") or "")
                matches = re.findall(r"!\[.*\]\((.*)\)", content)
                if matches:
                    image_name = matches[0]
                    defaults["content"] = (
                        re.sub(r"!\[.*\]\(.*\)", "", content, count=1).strip()
                    )

            # DnDMatch: push object-images to storage and regex-upload for string markers
            if act_type == "dndmatch":
                self._prepare_dndmatch_assets(defaults)
                self.regex_image_upload(defaults.get("content", ""), key_prefix="dndmatch/")

            # Twine: pre-upload in-file referenced images
            if act_type == "twine" and twine_name:
                twine_path = self.folder_path / twine_name
                if not self._upload_twine_subassets(twine_path):
                    # Prevent later upload if source missing
                    twine_name = None

            # Clean defaults against model fields
            model_fields = {f.name: f for f in ActivityModel._meta.get_fields()}
            defaults = {
                k: v
                for k, v in defaults.items()
                if k in model_fields and (v is not None or getattr(model_fields[k], "null", False))
            }

            try:
                activity, created = ActivityModel.objects.update_or_create(
                    lesson=lesson,
                    order=order,
                    defaults=defaults,
                )
                self._log(
                    f"{'Created' if created else 'Updated'} "
                    f"{act_type} (Order: {order}): {activity.title}"
                )
                
                if "instructions_image" in act:
                    self._save_model_file(
                        instance=activity,
                        field_name="instructions_image",
                        rel_path=self.folder_path / act.pop("instructions_image"),
                        label=f"{ActivityModel.__name__} instr_image asset",
                    )

                # Upload primary file fields (if provided)
                if act_type in {"textcontent", "fillintheblank", "quiz"} and image_name:
                    self._save_model_file(
                        instance=activity,
                        field_name="image",
                        rel_path=self.folder_path / image_name,
                        label=f"{ActivityModel.__name__} asset",
                    )
                elif act_type == "video" and video_name:
                    self._save_model_file(
                        instance=activity,
                        field_name="video",
                        rel_path=self.folder_path / video_name,
                        label=f"{ActivityModel.__name__} asset",
                    )
                elif act_type == "twine" and twine_name:
                    self._save_model_file(
                        instance=activity,
                        field_name="file",
                        rel_path=self.folder_path / twine_name,
                        label=f"{ActivityModel.__name__} asset",
                    )
                    

                # Children
                if act_type == "quiz" and questions:
                    self._create_questions(activity, questions)
                elif act_type == "poll" and questions:
                    self._create_poll_questions(activity, questions)
                elif act_type == "conceptmap" and concepts:
                    self._create_concepts(activity, concepts)
                elif act_type == "slideshow" and slides:
                    self._create_slides(activity, slides)
            except Exception as e:
                self._err(
                    f"Failed to create/update {act_type} (Order: {order}): {e}"
                )
                import traceback

                traceback.print_exc()

    # ---------- DnDMatch helpers ----------
    def _prepare_dndmatch_assets(self, defaults: dict):
        content = defaults.get("content", []) or []
        for group in content:
            for match in group.get("matches", []):
                if not isinstance(match, str):
                    # Object form: {"image": "<relative_path>"}
                    rel = match.get("image")
                    if not rel:
                        continue
                    local = self.folder_path / rel
                    try:
                        with open(local, "rb") as f:
                            key = f"public/dndmatch/images/{Path(rel).name}"
                            saved = default_storage.save(key, f)
                            match["image"] = saved
                    except FileNotFoundError:
                        self._err(f"  DnD image not found: {local}")

    # ---------- Twine helpers ----------
    def _upload_twine_subassets(self, twine_path: Path) -> bool:
        try:
            with open(twine_path, "r", encoding="utf-8") as f:
                content = f.read()
            images = re.findall(
                r"image:(.*?\.(jpe?g|png|gif|bmp|webp|tiff?))", content
            )
            for tup in images:
                rel_image = tup[0].strip()
                local = self.folder_path / "twine" / rel_image
                try:
                    with open(local, "rb") as img:
                        s3_name = Path(rel_image).name
                        key = f"public/twine/images/{s3_name}"
                        default_storage.save(key, img)
                        self._log(f"  Uploaded Twine sub-asset: {rel_image}")
                except Exception:
                    self._err(
                        "Referenced twine image: "
                        f"'{rel_image}' not found at: {local}. Skipping..."
                    )
                    continue
            return True
        except FileNotFoundError:
            self._err(f"Twine file not found for regex processing: {twine_path}")
            return False

    # ---------- Children ----------
    def _create_questions(self, quiz, questions: List[dict]):
        self._log(f"  Processing {len(questions)} questions for quiz: {quiz.title}")
        for order, q in enumerate(questions, start=1):
            q = q.copy()
            question_image_name = q.pop("image", None)

            defaults = {
                "question_text": q.get("question_text", ""),
                "question_type": q.get("question_type", "multiple_choice"),
                "has_correct_answer": q.get("has_correct_answer", True),
                "choices": q.get("choices", {}),
                "is_required": q.get("is_required", True),
                "feedback_config": q.get("feedback_config", {}),
            }
            try:
                obj, created = Question.objects.update_or_create(
                    quiz=quiz, order=order, defaults=defaults
                )

                # If optional question image in json upload it
                if question_image_name:
                    self._save_model_file(
                        instance=obj,
                        field_name="image",
                        rel_path=self.folder_path / question_image_name,
                        label=f"Question image",
                    )
                self._log(
                    f"    {'Created' if created else 'Updated'} question "
                    f"(Order: {order}): {obj.question_text[:50]}..."
                )
            except Exception as e:
                self._err(
                    f"    Failed question (Order: {order}) for "
                    f"quiz '{quiz.title}': {e}"
                )

    def _create_poll_questions(self, poll, questions: List[dict]):
        self._log(f"  Processing {len(questions)} questions for poll: {poll.title}")
        for order, q in enumerate(questions, start=1):
            defaults = {
                "question_text": q.get("question_text", ""),
                "options": q.get("options", []),
                "allow_multiple": q.get("allow_multiple", False),
            }
            try:
                obj, created = PollQuestion.objects.update_or_create(
                    poll=poll, order=order, defaults=defaults
                )
                self._log(
                    f"    {'Created' if created else 'Updated'} poll question "
                    f"(Order: {order}): {obj.question_text[:50]}..."
                )
            except Exception as e:
                self._err(
                    f"    Failed poll question (Order: {order}) for "
                    f"poll '{poll.title}': {e}"
                )

    def _create_concepts(self, cmap, concepts: List[dict]):
        self._log(
            f"  Processing {len(concepts)} concepts for concept map: {cmap.title}"
        )
        for order, payload in enumerate(concepts, start=1):
            payload = payload.copy()
            image_filename = payload.pop("image", None)

            # Upload example images to bucket and store path in JSON
            examples = payload.get("examples", []) or []
            for ex in examples:
                img = ex.get("image")
                if not img:
                    continue
                try:
                    self.bucket_url_call(img, key_prefix="concept/")
                    ex["image"] = f"public/concept/{Path(img).name}"
                except Exception as e:
                    self._err(f"    Failed to upload example image '{img}': {e}")
                    ex["image"] = None

            model_fields = {f.name: f for f in Concept._meta.get_fields()}
            defaults = {
                "title": payload.get("title", f"Concept {order}"),
                "description": payload.get("description", ""),
                "examples": examples,
                "instructions": payload.get("instructions"),
            }
            defaults = {
                k: v
                for k, v in defaults.items()
                if k in model_fields and (v is not None or getattr(model_fields[k], "null", False))
            }

            try:
                obj, created = Concept.objects.update_or_create(
                    concept_map=cmap,
                    lesson=cmap.lesson,
                    order=order,
                    defaults=defaults,
                )
                if image_filename:
                    self._save_model_file(
                        instance=obj,
                        field_name="image",
                        rel_path=self.folder_path / image_filename,
                        label="Concept image",
                    )
                self._log(
                    f"    {'Created' if created else 'Updated'} concept "
                    f"(Order: {order}): {obj.title[:50]}..."
                )
            except Exception as e:
                self._err(
                    f"    Failed concept (Order: {order}) for "
                    f"'{cmap.title}': {e}"
                )

    def _create_slides(self, slideshow: Slideshow, slides: List[dict]):
        self._log(f"  Processing {len(slides)} slides for slideshow: {slideshow.title}")
        for order, s in enumerate(slides, start=0):
            s = s.copy()
            image_filename = s.pop("image", None)
            slide = Slide.objects.create(
                slideshow=slideshow, order=order, content=s.get("content")
            )
            if image_filename:
                self._save_model_file(
                    instance=slide,
                    field_name="image",
                    rel_path=self.folder_path / image_filename,
                    label="Slide image",
                )

    # ---------- Storage helpers ----------
    def _save_model_file(
        self, instance, field_name: str, rel_path: Path, label: str
    ):
        try:
            with open(rel_path, "rb") as f:
                getattr(instance, field_name).save(
                    Path(rel_path.name).name, File(f), save=True
                )
            self._log(f"  Uploaded {label}: {rel_path.name}")
        except FileNotFoundError:
            self._err(f"  File not found: {rel_path}")

    def regex_image_upload(self, content: Any, key_prefix: str = "", subfolder: str = ""):
        images = re.findall(
            r"image:(.*?\.(jpe?g|png|gif|bmp|webp|tiff?))", str(content)
        )
        for m in images:
            self.bucket_url_call(f"{subfolder}{m[0]}", key_prefix)

    def _upload_image_to_bucket(self, image_filename: str, key_prefix: str = "") -> str:
        final_path = self.folder_path / image_filename
        with open(final_path, "rb") as f:
            save_key = f"public/{key_prefix}{Path(image_filename).name}"
            saved = default_storage.save(save_key, f)
            url = default_storage.url(saved)
            self._log(".UPLOADED")
            return url

    def bucket_url_call(self, image_filename: str, key_prefix: str = "") -> Optional[str]:
        msg = f"  UPLOADING: '{image_filename}' INTO 'public/{key_prefix}'"
        self._log(f"{msg:.<77}", ending="")
        final_key = f"public/{key_prefix}{Path(image_filename).name}"
        try:
            if default_storage.exists(final_key):
                self._log("CACHE HIT")
                return default_storage.url(final_key)
            return self._upload_image_to_bucket(image_filename, key_prefix)
        except Exception:
            self._err("No bucket found or connection error.")
            self._err("Attempting to create bucket...")
            if settings.DEBUG:
                self._warn("Development mode: Creating MinIO bucket")
                self._create_minio_bucket()
                return self._upload_image_to_bucket(image_filename, key_prefix)
            else:
                self._err(
                    "Production error: Bucket or file access failed for "
                    f"{image_filename}. Skipping this image. Ensure S3 bucket "
                    "exists and permissions are correct."
                )
                return None

    def _create_minio_bucket(self):
        s3_client = boto3.client(
            "s3",
            endpoint_url="http://minio:9000",
            aws_access_key_id="minioadmin",
            aws_secret_access_key="minioadmin",
        )
        bucket = settings.STORAGES["default"]["OPTIONS"]["bucket_name"]
        try:
            s3_client.create_bucket(Bucket=bucket)
            self._ok(f"Bucket Created: {bucket}")
        except s3_client.exceptions.BucketAlreadyOwnedByYou:
            self._warn(f'Bucket "{bucket}" already exists. Continuing.')
        except Exception as e:
            self._err(f"Failed to create or configure bucket: {e}")
            raise

    # ---------- Logging ----------
    def _log(self, msg: str, ending: str = "\n"):
        self.stdout.write(msg, ending=ending)

    def _ok(self, msg: str):
        self.stdout.write(self.style.SUCCESS(msg))

    def _warn(self, msg: str):
        self.stdout.write(self.style.WARNING(msg))

    def _err(self, msg: str):
        self.stdout.write(self.style.ERROR(msg))