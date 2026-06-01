# Backend Setup — Avatar / Media Storage

The frontend sends avatar files to `PATCH /api/v1/auth/avatar/` as multipart FormData.
For files to land in the `media/` folder, the Django backend needs the following.

---

## 1. settings.py

```python
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Media files (user uploads)
MEDIA_URL  = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')   # <-- files saved here
```

---

## 2. urls.py (project-level)

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your routes ...
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

> In production use a proper file server (nginx / S3) instead of `static()`.

---

## 3. User model — avatar field

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

def avatar_upload_path(instance, filename):
    return f'avatars/{instance.pk}/{filename}'

class User(AbstractUser):
    phone   = models.CharField(max_length=15, blank=True)
    college = models.CharField(max_length=200, blank=True)
    year    = models.CharField(max_length=50, blank=True)
    bio     = models.TextField(blank=True)
    avatar  = models.ImageField(
        upload_to=avatar_upload_path,
        null=True, blank=True
    )
```

---

## 4. Avatar view — PATCH & DELETE

```python
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

class AvatarView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        file = request.FILES.get('avatar')

        if file:
            # Delete old file from disk before saving new one
            if user.avatar:
                user.avatar.delete(save=False)
            user.avatar = file
            user.save(update_fields=['avatar'])
            return Response({'avatar': request.build_absolute_uri(user.avatar.url)})

        # No file sent → treat as remove
        if user.avatar:
            user.avatar.delete(save=False)
            user.avatar = None
            user.save(update_fields=['avatar'])
        return Response({'avatar': None})

    def delete(self, request):
        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)   # removes file from disk
            user.avatar = None
            user.save(update_fields=['avatar'])
        return Response(status=status.HTTP_204_NO_CONTENT)
```

---

## 5. URL registration

```python
# api/v1/auth/urls.py
from .views import AvatarView

urlpatterns += [
    path('avatar/', AvatarView.as_view(), name='avatar'),
]
```

---

## 6. Pillow (already in requirements.txt)

Pillow is required for `ImageField`. It's already listed — just make sure it's installed:

```bash
pip install -r requirements.txt
```

---

## Result

- Uploaded avatars → `media/avatars/<user_pk>/<filename>`
- Served at → `http://127.0.0.1:8000/media/avatars/<user_pk>/<filename>`
- The frontend's `resolveAvatar()` already handles relative paths by prepending `VITE_API_URL`
