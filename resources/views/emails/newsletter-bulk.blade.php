{{-- resources/views/emails/newsletter-bulk.blade.php --}}
{{--
    Professional campaign template.

    Table-based + inline CSS: Outlook (Word engine) ignores <style> blocks and
    most modern selectors, so a responsive-but-valid email needs the old
    layout primitives. The admin-authored body is injected with {!! !!}
    because it has already been merge-tag resolved AND sanitised by
    App\Services\NewsletterContentRenderer inside the queue job.
--}}
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $subject }}</title>
    <meta name="x-apple-disable-message-reformatting">
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings></xml></noscript>
    <![endif]-->
    <style>
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse !important; }
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        a { text-decoration: underline; }
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
        @media only screen and (max-width: 620px) {
            .nl-container { width: 100% !important; }
            .nl-px { padding-left: 20px !important; padding-right: 20px !important; }
            .nl-h1 { font-size: 24px !important; line-height: 32px !important; }
        }
    </style>
</head>

<body style="margin:0; padding:0; background-color:#eef2f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased;">

    {{-- Preheader: grey line in the inbox list, hidden in the body --}}
    <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
        @if(!empty($previewText))
            {{ $previewText }}
        @else
            {{ \Illuminate\Support\Str::limit(trim(strip_tags($content)), 120) }}
        @endif
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color:#eef2f7; padding:24px 12px;">
        <tr>
            <td align="center" style="padding:24px 12px;">

                <table role="presentation" class="nl-container" width="600" cellpadding="0" cellspacing="0" border="0"
                    style="width:600px; max-width:600px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 24px rgba(15,35,60,.08);">

                    <tr>
                        <td class="nl-px" align="center" style="padding:28px 32px; background:#009BE2;">
                            <p style="margin:0; font-size:20px; line-height:26px; font-weight:700; color:#ffffff; letter-spacing:.3px;">
                                {{ config('app.name') }}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td class="nl-px" style="padding:28px 32px 8px 32px;">
                            <h1 class="nl-h1"
                                style="margin:0 0 12px 0; font-size:26px; line-height:34px; font-weight:700; color:#0f233c;">
                                {{ $firstName !== '' ? 'Hello ' . $firstName . '!' : 'Hello!' }}
                            </h1>
                        </td>
                    </tr>

                    {{-- ADMIN-AUTHORED BODY (already sanitised by the queue job) --}}
                    <tr>
                        <td class="nl-px" style="padding:0 32px 8px 32px; font-size:16px; line-height:26px; color:#33455c;">
                            {!! $content !!}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 32px 8px 32px; font-size:16px; line-height:20px;">&nbsp;</td>
                    </tr>

                    {{-- FOOTER --}}
                    <tr>
                        <td class="nl-px" style="padding:20px 32px 28px 32px; border-top:1px solid #e6ecf3;">
                            <p style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#6b7f95;">
                                You are receiving this because you subscribed to the
                                {{ config('app.name') }} newsletter.
                            </p>
                            <p style="margin:0 0 12px 0; font-size:13px; line-height:20px; color:#6b7f95;">
                                <a href="{{ $unsubscribeUrl }}" target="_blank" rel="noopener noreferrer"
                                    style="color:#009BE2; text-decoration:underline; font-weight:600;">
                                    Unsubscribe
                                </a>
                                from future emails.
                            </p>
                            <p style="margin:0; font-size:12px; line-height:18px; color:#93a4b8;">
                                &copy; {{ $year }} {{ config('app.name') }}. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>

                <p style="margin:18px 0 0 0; font-size:11px; line-height:16px; color:#93a4b8; text-align:center;">
                    Sent by {{ config('app.name') }} &middot; This is an automated message, please do not reply.
                </p>

            </td>
        </tr>
    </table>

</body>

</html>
