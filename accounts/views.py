from accounts.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views.generic import CreateView
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth.forms import PasswordResetForm
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from .forms import PasswordResetViaEmailForm
from django.contrib.auth.views import PasswordChangeDoneView
# Create your views here.

class SignUpView(CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'



def password_reset_via_email(request):
    if request.method == 'POST':
        password_reset_form = PasswordResetViaEmailForm(request.POST)
        if password_reset_form.is_valid():
            email = password_reset_form.cleaned_data['email']
            associated_users = User.objects.filter(email=email)
            if associated_users.exists():
                for user in associated_users:
                    token = default_token_generator.make_token(user)
                    uid = urlsafe_base64_encode(force_bytes(user.pk))
                    reset_link = request.build_absolute_uri(
                        reverse_lazy('password_reset_confirm', kwargs={'uidb64': uid, 'token': token})
                    )
                    email_subject = 'Password reset request'
                    email_message = render_to_string('registration/html_password_reset_email.html', {
                        'user': user,
                        'reset_link': reset_link,
                    })
                    plain_message = f"Hi {user.username},\n\nWe received a request to reset your password for your account. If you did not make this request, please ignore this email. Otherwise, you can reset your password using the link below:\n{reset_link}\n\nIf you have any issues, please contact our support team.\n\nThank you,\nThe SoundScapers Team"
                    
                    email = EmailMultiAlternatives(
                        subject=email_subject,
                        body=plain_message,
                        from_email=settings.EMAIL_HOST_USER,
                        to=[email]
                    )
                    # Ensure HTML content is attached correctly
                    email.attach_alternative(email_message, "text/html")
                    email.send(fail_silently=False)
                return redirect('password_reset_done')
    else:
        password_reset_form = PasswordResetViaEmailForm()
    return render(request, 'registration/password_reset_form.html', {'form': password_reset_form})


class CustomPasswordChangeView(PasswordChangeDoneView):
    template_name = 'registration/password_change_form.html'
    success_url = reverse_lazy('password_change_done')