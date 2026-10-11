from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


def send_organization_invitation_email(invitation):
    """
    Send an organization invitation email using an HTML template
    and a plain-text alternative.
    """

    frontend_url = settings.FRONTEND_URL.rstrip("/")

    invitation_url = (
        f"{frontend_url}/invitations/{invitation.token}"
    )

    subject = (
        f"You've been invited to join "
        f"{invitation.organization.name} on Film Tracker"
    )

    context = {
        "invitation": invitation,
        "invitation_url": invitation_url,
    }

    # Render the HTML email template.
    html_content = render_to_string(
        "accounts/emails/organization_invitation.html",
        context,
    )

    # Plain-text alternative for email clients that don't display HTML.
    text_content = (
        f"Hello {invitation.first_name},\n\n"
        f"You've been invited to join "
        f"{invitation.organization.name} on Film Tracker.\n\n"
        f"Your assigned role: {invitation.get_role_display()}\n\n"
        f"Accept your invitation using this link:\n"
        f"{invitation_url}\n\n"
        f"This invitation expires on {invitation.expires_at:%d %b %Y, %I:%M %p}.\n\n"
        f"If you weren't expecting this invitation, you can ignore this email.\n\n"
        f"Film Tracker"
    )

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[invitation.email],
    )

    email.attach_alternative(html_content, "text/html")

    # Raise an exception if Django cannot send the email.
    return email.send(fail_silently=False)