{{-- resources/views/errors/maintenance.blade.php --}}

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Laravel') }} - Maintenance</title>

    {{-- Google Fonts --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">

    {{-- Tailwind CSS --}}
    <script src="https://cdn.tailwindcss.com"></script>

    <style>
        body {
            font-family: 'Bricolage Grotesque', sans-serif;
            background: #f8fafc;
        }

        .maintenance-icon {
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {

            0%,
            100% {
                transform: scale(1);
            }

            50% {
                transform: scale(1.05);
            }
        }

        .gear-spin {
            animation: spin 8s linear infinite;
        }

        @keyframes spin {
            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }
        }

        .progress-bar {
            background: linear-gradient(90deg, #009BE2, #4ECDC4);
            animation: progress 3s ease-in-out infinite;
            background-size: 200% 100%;
        }

        @keyframes progress {
            0% {
                background-position: -200% 0;
            }

            100% {
                background-position: 200% 0;
            }
        }
    </style>
</head>

<body>
    <div class="min-h-screen flex items-center justify-center px-4 py-12">
        <div class="max-w-2xl w-full text-center">
            {{-- Maintenance Icon --}}
            <div class="maintenance-icon mb-8">
                <div class="relative inline-block">
                    {{-- Gear icon using SVG --}}
                    <svg class="w-24 h-24 md:w-32 md:h-32 text-[#009BE2] gear-spin" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path
                            d="M12 2L12 4M12 20L12 22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12L4 12M20 12L22 12M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 8L12 6M12 18L12 16M8 12L6 12M18 12L16 12" />
                    </svg>

                    {{-- Overlay circle --}}
                    <div class="absolute inset-0 bg-[#009BE2]/10 rounded-full"></div>
                </div>
            </div>

            {{-- Status Code --}}
            <div class="text-sm font-semibold text-[#009BE2] uppercase tracking-wider mb-2">
                Service Unavailable
            </div>

            {{-- Title --}}
            <h1 class="text-3xl md:text-5xl font-bold text-[#080C14] mb-4">
                We'll Be Back Soon!
            </h1>

            {{-- Message --}}
            <p class="text-base md:text-lg text-[#515151] mb-6 max-w-lg mx-auto leading-relaxed">
                {{-- You can customize this message --}}
                Our website is currently undergoing scheduled maintenance to improve your experience.
                We apologize for any inconvenience and appreciate your patience.
            </p>

            {{-- Estimated Time --}}
            <div class="bg-white rounded-xl shadow-md p-5 mb-6 max-w-md mx-auto">
                <div class="flex items-center justify-center gap-3 text-sm text-[#515151]">
                    <svg class="w-5 h-5 text-[#009BE2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Estimated downtime: <strong class="text-[#080C14]">~15-30 minutes</strong></span>
                </div>
                <div class="mt-3 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full progress-bar rounded-full"></div>
                </div>
            </div>

            {{-- Action Buttons --}}
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                {{-- Refresh Button --}}
                <button onclick="location.reload()"
                    class="px-6 py-3 bg-[#009BE2] text-white rounded-lg font-semibold hover:bg-[#0080C4] transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Check Again
                </button>

                {{-- Contact Button --}}
                <a href="mailto:support@yourdomain.com"
                    class="px-6 py-3 bg-transparent border-2 border-[#009BE2] text-[#009BE2] rounded-lg font-semibold hover:bg-[#009BE2] hover:text-white transition-all duration-300 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Support
                </a>
            </div>

            {{-- Footer --}}
            <div class="mt-8 text-sm text-[#A0A0A0]">
                <p>&copy; {{ date('Y') }} {{ config('app.name', 'Laravel') }}. All rights reserved.</p>
                <div class="mt-1 flex items-center justify-center gap-4 text-xs">
                    <span class="flex items-center gap-1">
                        <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Status: Maintenance
                    </span>
                    <span>•</span>
                    <span>Ref: {{ strtoupper(substr(md5(uniqid()), 0, 8)) }}</span>
                </div>
            </div>
        </div>
    </div>

    {{-- Auto-refresh after 30 seconds --}}
    <script>
        // Auto refresh every 30 seconds to check if site is back up
        setTimeout(function() {
            location.reload();
        }, 30000);

        // Manual refresh with keyboard shortcut (Ctrl+R / Cmd+R)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                location.reload();
            }
        });
    </script>
</body>

</html>
