from django.contrib import admin
from collections import defaultdict
from django.utils.text import slugify

class CustomAdminSite(admin.AdminSite):
    site_header = "FORWARD Administration"
    site_title = "FORWARD Admin Panel"
    index_title = "Welcome to the FORWARD Admin site"

    def get_app_list(self, request, app_label=None):
        app_dict = self._build_app_dict(request)
        default_group_name = "Uncategorized"

        grouped_apps = defaultdict(
            lambda: {"name": "", "app_label": "", "models": []}
        )

        for _, app_info in app_dict.items():
            for model_info in app_info["models"]:
                model_admin = self._registry.get(model_info["model"])
                group_name = getattr(
                    model_admin, "grouping", app_info.get("name", default_group_name)
                )
                if not grouped_apps[group_name]["name"]:
                    grouped_apps[group_name]["name"] = group_name
                    grouped_apps[group_name]["app_label"] = slugify(group_name)
                grouped_apps[group_name]["models"].append(model_info)

        group_order = {"Core": 0, "Curriculum": 1, "Activities": 2, "Responses": 3, "Administration": 4}

        app_list = sorted(
            grouped_apps.values(),
            key=lambda x: (group_order.get(x["name"], len(group_order)), x["name"]),
        )
        for app in app_list:
            app["models"].sort(key=lambda x: x["name"])
        return app_list

custom_admin_site = CustomAdminSite(name="custom_admin")