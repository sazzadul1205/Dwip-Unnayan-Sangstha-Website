{{-- resources/views/emails/verification.blade.php --}}
{{--
    ─────────────────────────────────────────────────────────────────────────────
    Email Verification · Dwip Unoyon Songstha
    ─────────────────────────────────────────────────────────────────────────────
    Email-safe design notes:
      • Table-based layout (works in Gmail, Outlook, Apple Mail, Yahoo, mobile)
      • Inline styles on every element (Gmail strips <style> selectively)
      • VML fallback for the CTA button in Outlook (desktop)
      • Preheated text for the inbox preview line
      • Media query in <style> is *progressive enhancement only*
      • Gradient has a solid `background-color` fallback for unsupported clients

    Required Blade variables (unchanged):
      • $userName        – recipient's display name
      • $verificationUrl – signed verification link
    • Dwip Unoyon Songstha / asset('images/icon.png') / date('Y')
    ─────────────────────────────────────────────────────────────────────────────
--}}

<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>Verify Your Email · Dwip Unoyon Songstha</title>

    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->

    <style>
        /* ─── Progressive enhancement (every rule has an inline counterpart) ─── */
        body {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        table,
        td {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
        }

        @media (max-width: 600px) {
            .container {
                width: 100% !important;
            }

            .pad {
                padding-left: 24px !important;
                padding-right: 24px !important;
            }

            .hero-title {
                font-size: 26px !important;
                line-height: 34px !important;
            }

            .btn-wrapper {
                width: 100% !important;
                display: block !important;
            }

            .btn-wrapper a {
                display: block !important;
            }
        }
    </style>
</head>

<body
    style="margin:0; padding:0; background-color:#f5f1eb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#1b1b18; -webkit-font-smoothing:antialiased;">

    {{-- ───────────────────────────────────────────────────────────────────── --}}
    {{-- Preheated — hidden text that appears in the inbox preview line.        --}}
    {{-- Zero-width non-joiner entities prevent the following content from leaking in. --}}
    {{-- ───────────────────────────────────────────────────────────────────── --}}
    <div
        style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all; font-family:sans-serif;">
        Confirm your email to activate your job seeker account at Dwip Unoyon Songstha.
        &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>

    {{-- ───────────────────────────────────────────────────────────────────── --}}
    {{-- Outer wrapper                                                         --}}
    {{-- ───────────────────────────────────────────────────────────────────── --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color:#f5f1eb;">
        <tr>
            <td align="center" style="padding: 32px 16px;">

                <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0"
                    border="0" style="max-width:600px; width:100%;">

                    {{-- ─── Card ─── --}}
                    <tr>
                        <td
                            style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.06);">

                            {{-- ═══════════════════════════════════════════════════ --}}
                            {{-- HEADER BAND — orange→amber gradient                  --}}
                            {{-- ═══════════════════════════════════════════════════ --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" bgcolor="#ea580c"
                                        style="background-color:#ea580c; background-image:linear-gradient(135deg,#ea580c 0%,#f59e0b 100%); padding: 40px 24px 36px;">

                                        {{-- Logo --}}
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                                            align="center" style="margin-bottom:20px;">
                                            <tr>
                                                <td align="center" valign="middle" width="64" height="64"
                                                    style="background:#ffffff; border-radius:16px; padding:8px; box-shadow:0 6px 20px rgba(0,0,0,0.18);">
                                                    <img src="{{ asset('images/icon.png') }}" alt="Dwip Unoyon Songstha"
                                                        width="48" height="48"
                                                        style="display:block; width:48px; height:48px; border-radius:10px;">
                                                </td>
                                            </tr>
                                        </table>

                                        {{-- Org eyebrow --}}
                                        <p
                                            style="margin:0 0 8px; color:#ffffff; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; opacity:0.92;">
                                            Dwip Unoyon Songstha
                                        </p>

                                        {{-- Headline --}}
                                        <h1 class="hero-title"
                                            style="margin:0; color:#ffffff; font-size:30px; line-height:1.2; font-weight:800; letter-spacing:-0.5px;">
                                            Welcome aboard&nbsp;🎉
                                        </h1>

                                        <p
                                            style="margin:10px 0 0; color:#fff7ed; font-size:14px; line-height:1.55; font-weight:500;">
                                            Your job seeker account is almost ready
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            {{-- ═══════════════════════════════════════════════════ --}}
                            {{-- GREETING + INTRO                                     --}}
                            {{-- ═══════════════════════════════════════════════════ --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="pad" style="padding: 40px 48px 4px;">
                                        <p
                                            style="margin:0 0 12px; font-size:17px; line-height:1.5; color:#1b1b18; font-weight:700;">
                                            Hi {{ $userName ?? 'there' }},
                                        </p>
                                        <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#57534e;">
                                            Thanks for joining <strong style="color:#1b1b18;">Dwip Unoyon
                                                Songstha</strong>!
                                            You're one click away from unlocking job matching, curated opportunities,
                                            and application tracking — all designed for island talent like you.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            {{-- ═══════════════════════════════════════════════════ --}}
                            {{-- CTA — bulletproof button (VML for Outlook)            --}}
                            {{-- ═══════════════════════════════════════════════════ --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="pad" align="center" style="padding: 0 48px;">

                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                                                     xmlns:w="urn:schemas-microsoft-com:office:word"
                                                     href="{{ $verificationUrl ?? '#' }}"
                                                     style="height:54px; v-text-anchor:middle; width:280px;"
                                                     arcsize="20%" stroke="f" fillcolor="#ea580c">
                                            <w:anchorlock/>
                                            <center style="color:#ffffff; font-family:Arial,sans-serif; font-size:16px; font-weight:700;">
                                                Verify My Email &nbsp;→
                                            </center>
                                        </v:roundrect>
                                        <![endif]-->

                                        <!--[if !mso]><!-->
                                        <a href="{{ $verificationUrl ?? '#' }}" target="_blank" rel="noopener"
                                            class="btn-wrapper"
                                            style="display:inline-block; box-sizing:border-box; padding:16px 40px;
                                                  background-color:#ea580c;
                                                  background-image:linear-gradient(135deg,#ea580c 0%,#f59e0b 100%);
                                                  color:#ffffff; text-decoration:none;
                                                  font-weight:700; font-size:16px; letter-spacing:0.2px;
                                                  border-radius:12px;
                                                  box-shadow:0 10px 24px rgba(234,88,12,0.35);">
                                            Verify My Email &nbsp;→
                                        </a>
                                        <!--<![endif]-->

                                        <p style="margin:16px 0 0; font-size:12px; color:#a8a29e; text-align:center;">
                                            ⏱ This link expires in 60&nbsp;minutes
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            {{-- ═══════════════════════════════════════════════════ --}}
                            {{-- FALLBACK LINK — for clients that strip buttons       --}}
                            {{-- ═══════════════════════════════════════════════════ --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="pad" style="padding: 32px 48px 8px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                            border="0"
                                            style="background:#fdf8f3; border:1px solid #f5e5d4; border-radius:12px;">
                                            <tr>
                                                <td style="padding: 18px 22px;">
                                                    <p
                                                        style="margin:0 0 6px; font-size:11px; font-weight:700; color:#78716c; text-transform:uppercase; letter-spacing:0.7px;">
                                                        Button not working?
                                                    </p>
                                                    <p
                                                        style="margin:0 0 10px; font-size:13px; line-height:1.55; color:#57534e;">
                                                        Copy and paste this link into your browser:
                                                    </p>
                                                    <p
                                                        style="margin:0; font-size:12px; line-height:1.55; word-break:break-all;">
                                                        <a href="{{ $verificationUrl ?? '#' }}"
                                                            style="color:#ea580c; text-decoration:underline; font-family:Consolas,Monaco,'Courier New',monospace;">
                                                            {{ $verificationUrl ?? '#' }}
                                                        </a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            {{-- ═══════════════════════════════════════════════════ --}}
                            {{-- WHAT HAPPENS NEXT — 3-step visual list               --}}
                            {{-- ═══════════════════════════════════════════════════ --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                border="0">
                                <tr>
                                    <td class="pad" style="padding: 32px 48px 8px;">
                                        <p style="margin:0 0 16px; font-size:14px; font-weight:700; color:#1b1b18;">
                                            What happens next?
                                        </p>

                                        {{-- Step 1 --}}
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                            border="0" style="margin-bottom:14px;">
                                            <tr>
                                                <td width="40" valign="top" style="padding-top:2px;">
                                                    <div
                                                        style="width:28px; height:28px; background:#fff4e6; border-radius:8px; text-align:center; line-height:28px; font-size:14px;">
                                                        ✅
                                                    </div>
                                                </td>
                                                <td valign="top">
                                                    <p
                                                        style="margin:0 0 2px; font-size:13px; font-weight:700; color:#1b1b18;">
                                                        Confirm your email
                                                    </p>
                                                    <p
                                                        style="margin:0; font-size:13px; line-height:1.55; color:#78716c;">
                                                        Click the button above to activate your account.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        {{-- Step 2 --}}
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                            border="0" style="margin-bottom:14px;">
                                            <tr>
                                                <td width="40" valign="top" style="padding-top:2px;">
                                                    <div
                                                        style="width:28px; height:28px; background:#fff4e6; border-radius:8px; text-align:center; line-height:28px; font-size:14px;">
                                                        👤
                                                    </div>
                                                </td>
                                                <td valign="top">
                                                    <p
                                                        style="margin:0 0 2px; font-size:13px; font-weight:700; color:#1b1b18;">
                                                        Complete your profile
                                                    </p>
                                                    <p
                                                        style="margin:0; font-size:13px; line-height:1.55; color:#78716c;">
                                                        Add your details and upload your resume — takes 2 minutes.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        {{-- Step 3 --}}
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                            border="0">
                                            <tr>
                                                <td width="40" valign="top" style="padding-top:2px;">
                                                    <div
                                                        style="width:28px; height:28px; background:#fff4e6; border-radius:8px; text-align:center; line-height:28px; font-size:14px;">
                                                        🚀
                                                    </div>
                                                </td>
                                                <td valign="top">
                                                    <p
                                                        style="margin:0 0 2px; font-size:13px; font-weight:700; color:#1b1b18;">
                                                        Start applying
                                                    </p>
                                                    <p
                                                        style="margin:0; font-size:13px; line-height:1.55; color:#78716c;">
                                                        Browse matched roles and apply with one click.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            {{-- ═══════════════════════════════════════════════════ --}}
                            {{-- DIVIDER + SECURITY NOTE                              --}}
                            {{-- ═══════════════════════════════════════════════════ --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                border="0">
                                <tr>
                                    <td class="pad" style="padding: 24px 48px 0;">
                                        <div style="border-top:1px solid #e7e5e4; line-height:0; font-size:0;">&nbsp;
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="pad" style="padding: 24px 48px 36px;">
                                        <p style="margin:0; font-size:13px; line-height:1.65; color:#78716c;">
                                            🔒 <strong style="color:#57534e;">Didn't sign up?</strong>
                                            If you didn't create an account with Dwip Unoyon Songstha,
                                            you can safely ignore this email — no further action is needed.
                                            The link will expire automatically.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            {{-- ═══════════════════════════════════════════════════ --}}
                            {{-- FOOTER                                               --}}
                            {{-- ═══════════════════════════════════════════════════ --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                border="0">
                                <tr>
                                    <td align="center" bgcolor="#faf5ee"
                                        style="background-color:#faf5ee; padding: 24px 40px; border-top:1px solid #f0e6d8;">

                                        <p style="margin:0 0 6px; font-size:13px; font-weight:700; color:#1b1b18;">
                                            Dwip Unoyon Songstha
                                        </p>
                                        <p style="margin:0 0 6px; font-size:11px; line-height:1.55; color:#a8a29e;">
                                            Connecting island talent with meaningful opportunities.
                                        </p>
                                        <p style="margin:0; font-size:11px; line-height:1.55; color:#a8a29e;">
                                            &copy; {{ date('Y') }} Dwip Unoyon Songstha. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    {{-- Small spacing + un-monitored note below the card --}}
                    <tr>
                        <td align="center" style="padding: 20px 16px 0;">
                            <p style="margin:0; font-size:11px; line-height:1.55; color:#a8a29e;">
                                This is an automated message — please do not reply to this email.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>

</html>
