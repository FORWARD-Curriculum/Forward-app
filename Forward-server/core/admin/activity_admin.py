from core.models import (Lesson, ActivityManager, BaseActivity, Twine, TextContent, Quiz, Question, Writing,
                         Embed, DndMatch, Concept, ConceptMap, Video, LikertScale, FillInTheBlank, Identification, IdentificationItem,
                         Slideshow, Slide, CustomActivity, CustomActivityImageAsset, PDF)
from django import forms
from .admin import custom_admin_site
from django.utils.html import format_html, format_html_join
from django.contrib import admin
from django import core
import json
from pathlib import Path
from django.core.files.storage import default_storage
from django.urls import reverse, path
from django.utils.text import capfirst
from adminsortable2.admin import SortableTabularInline, SortableAdminMixin, SortableStackedInline
from django.shortcuts import redirect, get_object_or_404
from django.db import transaction
from django.utils.safestring import mark_safe

class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True

class MultipleFileField(forms.FileField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        if not data:
            return []
        single_clean = super().clean
        if isinstance(data, (list, tuple)):
            return [single_clean(d, initial) for d in data]
        return [single_clean(data, initial)]

# shows formatted json of a field that uses json
class JsonAdminMixin:
    def formatted_json_field(self, obj, field_name):
        data = getattr(obj, field_name, None)
        if data:
            pretty = json.dumps(data, indent=2)
            return format_html(
                '<pre style="white-space: pre-wrap; word-break: break-all;">{}</pre>',
                pretty,
            )
        return "Empty"

    def display_content_as_json(self, obj):
        return self.formatted_json_field(obj, "content")

    display_content_as_json.short_description = "Content (Formatted)"

    def display_prompts_as_json(self, obj):
        return self.formatted_json_field(obj, "prompts")

    display_prompts_as_json.short_description = "Prompts (Formatted)"


def save_file(uploaded_file, key_prefix: str) -> str:
    """
    Save a file to default storage under public/{key_prefix}{filename}.
    Replaces any existing file with the same key.
    Returns the saved storage key.
    """
    file_key = f"public/{key_prefix}{Path(uploaded_file.name).name}"
    if default_storage.exists(file_key):
        default_storage.delete(file_key)
    return default_storage.save(file_key, uploaded_file)

# ---------------------------------------------------------------------
# Curriculum
# ---------------------------------------------------------------------

@admin.register(Lesson, site=custom_admin_site)
class LessonAdmin(admin.ModelAdmin):
    grouping = "Curriculum"
    list_display = ("title", "order","active", "created_at", "updated_at")
    search_fields = ("title", "description")
    ordering = ("order",)
    list_editable = ("order",)
    
    fields = ("title","active", "order", "objectives", "tags", "image", "image_preview", "sorted_activities")
    readonly_fields = ("image_preview", "sorted_activities")

    def sorted_activities(self, obj: Lesson):
        """
        Gathers all related activity instances from various registered models,
        sorts them by their 'order' attribute, and renders them as an HTML list
        with links to their admin change pages.
        """
        if not obj.id:
            return format_html("<strong>Save the lesson to view and add activities.</strong>")

        all_activities = []
        
        for value in ActivityManager.registered_activities.values():
            ActivityModel, child_class = value[0], value[3]
            if not child_class:
                activities = list(ActivityModel.objects.filter(
                    lesson=obj))
                for activity in activities:
                    all_activities.append(activity)

        all_activities.sort(key=lambda x: x.order)

        if not all_activities:
            return "No activities found for this lesson."

        # Build the HTML list
        html_list_items = []
        for activity in all_activities:
            meta = activity._meta
            
            # Generate the URL to the admin change view for the specific activity object
            url = reverse(f'admin:{meta.app_label}_{meta.model_name}_change', args=(activity.pk,))
            
            # Create a list item with the model name, a link to the object, and its order
            list_item = format_html(
                '<tr style="margin-bottom: 5px;">'
                    '<td>{order}</td>'
                    '<td>{model_name}</a></td>'
                    '<td><a href="{url}">{obj_str}</a></td>'
                '</tr>',
                model_name=capfirst(meta.verbose_name),
                url=url,
                obj_str=str(activity),
                order=activity.order
            )
            html_list_items.append(list_item)
        
        return format_html(
            '<style>'
            '.readonly:has(table) {{flex-grow: 1;}}'
            '</style>'
            '<table style="width: 100%;">'
            '<thead>'
                '<tr>'
                    '<th scope="col">'
                        '<div class="text">Order</div>'
                    '</th>'
                    '<th scope="col">'
                        '<div class="text">Type</div>'
                    '</th>'
                    '<th scope="col">'
                        '<div class="text">Title</div>'
                    '</th>'
                '</tr>'
            '</thead>'
            '<tbody>{}</tbody>''</table>', format_html("".join(html_list_items)))

    sorted_activities.short_description = "Activities (sorted by order)"

    # The get_inlines method is no longer needed with this approach.
    # def get_inlines(self, request, obj=None):
    #     ...

    def image_preview(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            return _image_tag(obj.image.url)
        return "No Image"

    image_preview.short_description = "Image Preview"


# ---------------------------------------------------------------------
# Activities
# ---------------------------------------------------------------------


def _image_tag(url: str | None, max_h=500, max_w=800):
    if not url:
        return "No Image"
    return format_html(
        '<img src="{}" style="max-width:{}px; max-height:{}px; width:auto; height:auto;" />',
        url,
        max_w,
        max_h,
    )

class BaseActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "lesson", "order", "updated_at")
    list_filter = ("lesson",)
    search_fields = ("title", "instructions")
    ordering = ("lesson", "order")
    list_editable = ("order",)
    

class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0
    ordering = ("order",)

@admin.register(Quiz, site=custom_admin_site)
class QuizAdmin(BaseActivityAdmin):
    grouping = "Activities"
    inlines = [QuestionInline]
    list_display = ("title", "lesson", "order", "passing_score")

class SlideInline(admin.TabularInline):
    model=Slide
    readonly_fields = ("image_preview",)
    extra = 0

    def image_preview(self, obj):
        return _image_tag(obj.image.url)

    image_preview.short_description = "Image Preview"

@admin.register(Slideshow, site=custom_admin_site)
class SlideshowAdmin(BaseActivityAdmin):
    grouping = "Activities"
    inlines = [SlideInline]
    list_display = ("title", "lesson", "order")

class CustomActivityAssetInline(admin.TabularInline):
    model=CustomActivityImageAsset
    readonly_fields = ("image_preview","image_name")
    extra = 0

    def image_preview(self, obj: CustomActivityImageAsset):
        return _image_tag(obj.image.url, max_h=100)
    
    def image_name(self, obj: CustomActivityImageAsset):
        return format_html("<p>{}</p>",obj.name)

    image_preview.short_description = "Image Thumbnail"
    image_name.short_description = "Image Name"

@admin.register(CustomActivity, site=custom_admin_site)
class CustomActivityAdmin(BaseActivityAdmin):
    grouping = "Activities"
    inlines = [CustomActivityAssetInline]
    list_display = ("title", "lesson", "order")
    readonly_fields = ("preview","referenced_images")
    
    def referenced_images(self, obj: CustomActivity):
        images = obj.referenced_images()
        items_html = format_html_join("", "<li>{}</li>", ((img,) for img in images))
        return format_html("<ul>{}</ul>", items_html)
    
    referenced_images.short_description = "Detected Images"
    
    def preview(self, obj: CustomActivity):
        data = obj.to_dict()
        images_json = json.dumps(data["images"])

        # Read the HTML content from the uploaded file
        doc_content = ""
        if obj.document:
            try:
                obj.document.seek(0)  # Ensure we read from the start
                doc_content = obj.document.read().decode('utf-8')
            except (FileNotFoundError, ValueError):
                doc_content = "<p>Error: Could not read the document file.</p>"
        
        # Use srcdoc to embed the HTML directly, ensuring same-origin
        return format_html(
            """
            <style>
            .readonly:has(iframe) {{flex-grow: 1;}}
            </style>
            <script>
                function replace_src(event) {{
                    try {{
                        const iframe = event.currentTarget;
                        const images = JSON.parse(iframe.dataset.images);
                        const imap = new Map(Object.entries(images));
                        const doc = iframe.contentWindow?.document;
                        if (!doc) return;

                        const tags = doc.querySelectorAll("img");
                        tags.forEach((t) => {{
                            const src = t.getAttribute("src") || t.src;
                            if (imap.has(src)) {{
                                t.src = imap.get(src);
                            }}
                        }});
                    }} catch (err) {{
                        console.error("replace_src error:", err);
                    }}
                }}
            </script>
            <iframe
                srcdoc="{doc_content}"
                onload="replace_src(event)"
                sandbox="allow-scripts allow-same-origin"
                data-images='{images_json}'
                style="width:100%;height:auto;min-height: 1000px;border:1px solid #ccc;">
            </iframe>
            """,
            doc_content=doc_content,
            images_json=mark_safe(images_json),
        )

class IdentificationItemInline(admin.StackedInline):
    model=IdentificationItem
    readonly_fields = ("image_preview",)
    extra = 0

    def image_preview(self, obj: IdentificationItem):
            # Return a placeholder if there's no image
            if not obj.image:
                return "No image uploaded."

            # Start building the HTML with a relative container
            # This container will hold both the image and the coordinate boxes
            # We also move the onmousemove event here to cover the whole area
            html_content = f"""
                <div style="position: relative; width: 100%;" onmousemove="
                    const rect = event.currentTarget.getBoundingClientRect();
                    const img = event.currentTarget.querySelector('img');
                    if (!img) return;
                    const imgRect = img.getBoundingClientRect();
                    const mouseX = event.clientX - imgRect.left;
                    const mouseY = event.clientY - imgRect.top;
                    const percentX = (mouseX / imgRect.width) * 100;
                    const percentY = (mouseY / imgRect.height) * 100;
                    event.currentTarget.title = 'X: ' + percentX.toFixed(1) + '%, Y: ' + percentY.toFixed(1) + '%';
                ">
                    <img src="{obj.image.url}" style="width: 100%; display: block;">
            """

            # Check if there are any coordinates to display
            if obj.areas:
                # Loop through the list of saved coordinate dictionaries
                for area in obj.areas:
                    x1 = area.get('x1', 0)
                    y1 = area.get('y1', 0)
                    x2 = area.get('x2', 0)
                    y2 = area.get('y2', 0)

                    # Calculate width and height from the coordinates
                    width = x2 - x1
                    height = y2 - y1

                    html_content += f"""
                        <style>
                          [title] {{{{
                            position: relative;
                          }}}}

                          [title]:after {{{{
                            content: attr(title);
                            position: absolute;
                            left: 50%;
                            bottom: 100%; /* put it on the top */
                            color: var(--body-bg);
                            background-color: var(--body-fg);
                            padding:3px;
                            width: max-content;
                            opacity: 0;
                            -webkit-transition: opacity 0.0s ease-in-out;
                          }}}}

                          [title]:hover:after {{{{
                            opacity: 1;
                          }}}}
                        </style>
                        <div style="
                            position: absolute;
                            left: {x1}%;
                            top: {y1}%;
                            width: {width}%;
                            height: {height}%;
                            background-color: rgba(250, 204, 21, 0.5); /* yellow-400 with 50% opacity */
                            border: 2px solid #FBBF24; /* yellow-400 */
                            box-sizing: border-box; /* Ensures border is inside the div */
                        "></div>
                    """

            # Close the relative container div
            html_content += "</div>"
        
            return format_html(html_content)
    
    image_preview.short_description = "Image Preview with Saved Areas"


@admin.register(Identification, site=custom_admin_site)
class IdentificationAdmin(BaseActivityAdmin):
    grouping = "Activities"
    inlines=[IdentificationItemInline]

class ConceptInline(admin.StackedInline):
    model = Concept
    extra = 0
    ordering = ("order",)
    fields = ("order", "title", "description", "image", "examples")


@admin.register(ConceptMap, site=custom_admin_site)
class ConceptMapAdmin(BaseActivityAdmin):
    grouping = "Activities"
    inlines = [ConceptInline]

@admin.register(TextContent, site=custom_admin_site)
class TextContentAdmin(BaseActivityAdmin):
    grouping = "Activities"
    readonly_fields = ("image_preview",)

    def image_preview(self, obj):
        return _image_tag(obj.image.url)

    image_preview.short_description = "Image Preview"


@admin.register(Video, site=custom_admin_site)
class VideoAdmin(BaseActivityAdmin):
    grouping = "Activities"
    readonly_fields = ("video_preview",)

    def video_preview(self, obj):
        return format_html(
            '<video width="{}" height="{}" controls>'
            '<source src="{}" type="video/mp4">'
            "Your browser does not support the video tag.</video>",
            800,
            500,
            obj.video.url,
        )
        
    video_preview.short_description = "Video Preview"

class TwineAdminForm(forms.ModelForm):
    images_upload = MultipleFileField(
        required=False,
        help_text=(
            "Upload all referenced images for the Twine file. "
            "They will be saved to the S3 bucket."
        ),
    )

    class Meta:
        model = Twine
        # exclude = ("title",)
        fields = '__all__'

    def save(self, commit=True):
        uploaded_images = self.cleaned_data.get("images_upload")
        if uploaded_images:
            for uf in uploaded_images:
                save_file(uf, "twine/")

        uploaded_file = self.cleaned_data.get("file_upload")
        if uploaded_file:
            uploaded_file.seek(0)
            self.instance.file = uploaded_file.read().decode("utf-8")
        return super().save(commit=commit)

@admin.register(Twine, site=custom_admin_site)
class TwineAdmin(BaseActivityAdmin):
    grouping = "Activities"
    form = TwineAdminForm
    list_display = ("title", "lesson", "order")
    
    # TODO: embed twine in page as twine_preview

    # def file_snippet(self, obj):
    #     return obj.file[:100] + "..." if obj.file else "No content"

    # file_snippet.short_description = "File Content Snippet"


@admin.register(Writing, site=custom_admin_site)
class WritingAdmin(BaseActivityAdmin):
    grouping = "Activities"
    


@admin.register(DndMatch, site=custom_admin_site)
class DndMatchAdmin(BaseActivityAdmin):
    grouping = "Activities"
    


@admin.register(FillInTheBlank, site=custom_admin_site)
class FillInTheBlankAdmin(BaseActivityAdmin):
    grouping = "Activities"
    
    # TODO: content needs a lengthy desscription of the text formatting


@admin.register(PDF, site=custom_admin_site)
class PDFAdmin(BaseActivityAdmin):
    grouping = "Activities"

@admin.register(LikertScale, site=custom_admin_site)
class LikertScaleAdmin(BaseActivityAdmin):
    grouping = "Activities"


custom_admin_site.register(Embed, BaseActivityAdmin, grouping="Activities")
