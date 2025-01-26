from django.urls import path, include
from . views import SignUpView
from django.contrib.auth.views import (PasswordResetDoneView, PasswordResetConfirmView, PasswordChangeView, PasswordChangeDoneView)
from . views import password_reset_via_email


urlpatterns = [
    path("signup/", SignUpView.as_view(), name="signup"),
    path("accounts/", include("django.contrib.auth.urls")),
    path("password_reset_via_email/", password_reset_via_email, name="password_reset_via_email"),
    path("password_reset_done/", PasswordResetDoneView.as_view(), name="password_reset_done"),
    path("password_reset_confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("password_change/", PasswordChangeView.as_view(), name="password_change"),
    path("password_change_done/", PasswordChangeDoneView.as_view(), name="password_change_done"),

]