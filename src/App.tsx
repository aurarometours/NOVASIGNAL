const navLinks = ['Studio', 'Services', 'AI Systems', 'Contact'];

function Logo() {
  return (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="rgb(84, 84, 84)"
        d="M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z"
      />
    </svg>
  );
}

export default function App() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f0f0ee]">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="absolute inset-0 bg-[#f0f0ee]/10" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="flex items-center justify-center gap-2 px-4 pt-4 sm:gap-3 sm:px-8 sm:pt-6">
          <a
            href="#"
            aria-label="NovaSignal home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11"
            style={{ backgroundColor: '#EDEDED' }}
          >
            <Logo />
          </a>

          <div
            className="flex items-center gap-4 rounded-xl px-4 py-2.5 sm:gap-10 sm:px-8 sm:py-3"
            style={{ backgroundColor: '#EDEDED' }}
          >
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="text-[12px] font-medium text-gray-700 transition-colors duration-200 hover:text-gray-900 sm:text-[14px]"
              >
                {link}
              </a>
            ))}
          </div>
        </nav>

        <section className="flex flex-1 items-end px-6 pb-10 sm:px-12 sm:pb-16 md:px-20 lg:px-28 lg:pb-20">
          <div className="max-w-xs">
            <a
              href="#"
              className="group mb-3 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-blue-500 transition-colors hover:text-blue-600"
            >
              Websites, software, AI and mobile apps
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </a>

            <h1 className="mb-3 text-[1.5rem] font-medium leading-[1.15] tracking-tight text-gray-900 sm:text-[1.75rem]">
              Digital systems built for brands ready to move faster.
            </h1>

            <p className="mb-3 text-[13px] font-normal text-gray-400">
              Sites, apps, logos, chatbots and AI workflows engineered for growth.
            </p>

            <a
              href="mailto:hello@novasignal.studio"
              className="group inline-flex items-center gap-2 rounded-full border border-blue-400 px-5 py-2.5 text-[13px] font-medium text-blue-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-500 hover:text-white"
            >
              Start your project
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
