# Changelog

## [1.6.0](https://github.com/cradlen-app/cradlen-patient/compare/cradlen-patient-v1.5.0...cradlen-patient-v1.6.0) (2026-07-09)


### Features

* add Sentry error monitoring with PII scrubbing ([db2b7a6](https://github.com/cradlen-app/cradlen-patient/commit/db2b7a63ab4a5faeb3693363856c97bd022101d3))
* add Sentry error monitoring with PII scrubbing ([bf3b861](https://github.com/cradlen-app/cradlen-patient/commit/bf3b8610d1ee7aa99599a6249f68be196b8747d5))
* **patient-portal:** allow patients to change their national ID ([3fc27ce](https://github.com/cradlen-app/cradlen-patient/commit/3fc27ce983f562b9113ff6550f32bef2b914810d))
* **patient-portal:** allow patients to change their national ID ([e58c6dd](https://github.com/cradlen-app/cradlen-patient/commit/e58c6ddb33f34d4488aabe160029760fe5dc84ef))
* **profile:** remove Dependents section for now ([7e01002](https://github.com/cradlen-app/cradlen-patient/commit/7e0100285551de07af26d9c6706778f036fc056c))
* **profile:** remove Dependents section for now ([abf89ca](https://github.com/cradlen-app/cradlen-patient/commit/abf89ca809a0bac10bf5e04b08af48384da3b168))
* **push:** headless PushNotificationProvider mounted in Providers ([2b7127e](https://github.com/cradlen-app/cradlen-patient/commit/2b7127eef16046ec7ab1a37c3cb14e70d7fe7468))
* **push:** patient Web Push frontend (SW handlers, hook, provider, profile toggle) ([a8c8a06](https://github.com/cradlen-app/cradlen-patient/commit/a8c8a06e36b05a34591e02ecab5bc957dde5e696))
* **push:** profile Notifications toggle with iOS install hint ([b22729c](https://github.com/cradlen-app/cradlen-patient/commit/b22729c2c1d911517279c9f9af58b7b4475337d8))
* **push:** same-origin subscribe/unsubscribe proxy routes ([20171cc](https://github.com/cradlen-app/cradlen-patient/commit/20171cc582a0fc0788a590f906c95d514769bbea))
* **push:** service-worker push + notificationclick handlers ([e4139e2](https://github.com/cradlen-app/cradlen-patient/commit/e4139e21c9e5ace7bbabdb0bba6e149f7778df5e))
* **push:** usePushSubscription state machine (patient transport) ([3f04647](https://github.com/cradlen-app/cradlen-patient/commit/3f0464728835faecf9f7bc0622194f3322c89693))
* **push:** vapid lib + NEXT_PUBLIC_VAPID_PUBLIC_KEY env ([0e19553](https://github.com/cradlen-app/cradlen-patient/commit/0e19553e514f11536047b2adfc5504b1fb0a7684))
* **pwa:** add install metadata and viewport to root layout ([0228d9b](https://github.com/cradlen-app/cradlen-patient/commit/0228d9b0b36f5636a1246861d419a1d24a0232bc))
* **pwa:** add locale-neutral web app manifest ([12ca874](https://github.com/cradlen-app/cradlen-patient/commit/12ca8745ba790c3fd93f0366a4943fb17170e6d7))
* **pwa:** add offline fallback page served when disconnected ([5858ba4](https://github.com/cradlen-app/cradlen-patient/commit/5858ba40915fa6ee6882d324f7109384098a6ece))
* **pwa:** add Serwist service worker with NetworkOnly API routes ([7994821](https://github.com/cradlen-app/cradlen-patient/commit/7994821c573af9637eb708746e83293d1a6fbf08))
* **pwa:** allow worker/manifest in CSP and verify offline + no-PHI-cache ([f07fe30](https://github.com/cradlen-app/cradlen-patient/commit/f07fe3017aff9a03439ecd6cf0ad2fe9a29d678e))
* **pwa:** generate installable icon set into root public/ ([cf4fd17](https://github.com/cradlen-app/cradlen-patient/commit/cf4fd177321f158b2f7f06051c6526c23771ba57))
* **pwa:** Phase 2 — custom install banner + iOS sheet + offline bar ([80253ef](https://github.com/cradlen-app/cradlen-patient/commit/80253efc33d38781df02b58bb89d9aea006ea469))
* **pwa:** register service worker on the client ([da1ad47](https://github.com/cradlen-app/cradlen-patient/commit/da1ad472364a5676daab6cb7d656e1a4e853b742))
* **security:** add baseline security headers ([a0521ce](https://github.com/cradlen-app/cradlen-patient/commit/a0521ce4d2f0e73df6fa315e969604ff1954209a))
* **security:** enforce nonce-based CSP via middleware ([e9ad41c](https://github.com/cradlen-app/cradlen-patient/commit/e9ad41c800c897e730eb57cbd199dae8a54762b8))
* **signin:** link logo to landing site, enlarge forgot-password link ([39b8f09](https://github.com/cradlen-app/cradlen-patient/commit/39b8f099c4efed97b357cac46bb39f5e7ef5e3e5))
* **signin:** link logo to landing site, enlarge forgot-password link ([fa454f4](https://github.com/cradlen-app/cradlen-patient/commit/fa454f485aa74aebab5e16bff4020f8c21d536b5))
* **versioning:** in-app version display + new-deploy update prompts ([5856f3f](https://github.com/cradlen-app/cradlen-patient/commit/5856f3f73ce955c77191e791f1d5750206d38cfa))
* **versioning:** show app version in mobile More drawer ([21af444](https://github.com/cradlen-app/cradlen-patient/commit/21af444b7145925724134f8705000d0e1f4e3429))
* **versioning:** show app version in mobile More drawer ([4a4e6c2](https://github.com/cradlen-app/cradlen-patient/commit/4a4e6c20ca979a615bd9d31f22e7bc05efc5a094))
* **versioning:** show app version on patient profile screen ([f570d43](https://github.com/cradlen-app/cradlen-patient/commit/f570d4371371cf492599191eb72ba357ac12a7d4))


### Bug Fixes

* **csp:** allow blob: in img-src for local upload previews ([b4b7367](https://github.com/cradlen-app/cradlen-patient/commit/b4b73670b12592342580d8391593ee1d85b55e46))
* **csp:** allow blob: in img-src for local upload previews ([e7c8107](https://github.com/cradlen-app/cradlen-patient/commit/e7c8107c6cacc8255e24f60dbfba9aa3149572fe))
* **deps:** resolve high-severity vulnerabilities ([a05800e](https://github.com/cradlen-app/cradlen-patient/commit/a05800eb49abc4e6b0baef88391324b69e7672c5))
* **footer:** point content links to marketing site to avoid 404s ([88ae528](https://github.com/cradlen-app/cradlen-patient/commit/88ae52831e9b075677d63f2adab690690b5e371b))
* **footer:** point content links to marketing site to avoid 404s ([d3f2ca7](https://github.com/cradlen-app/cradlen-patient/commit/d3f2ca7200bfab378d7b81323538e1fc1079ce98))
* **home:** keep TodayCard in its loading state during identity resolve ([ff22c6c](https://github.com/cradlen-app/cradlen-patient/commit/ff22c6c5aa6ea199dd0ca2932d9a17cc1de59bb6))
* **layout:** increase portal scroll bottom padding to clear tab bar ([c2e8f27](https://github.com/cradlen-app/cradlen-patient/commit/c2e8f27f40b125f5646e307301ad00a0c73e9292))
* **layout:** increase portal scroll bottom padding to clear tab bar ([ed7b9a6](https://github.com/cradlen-app/cradlen-patient/commit/ed7b9a6ea96425a471dbaf28491b8334a54080a5))
* **layout:** move portal scroll padding to inner wrapper so last card clears tab bar ([27c7b9b](https://github.com/cradlen-app/cradlen-patient/commit/27c7b9b99e2c958942c8e8030272f6a399e28a04))
* **layout:** move portal scroll padding to inner wrapper so last card… ([91d0ba8](https://github.com/cradlen-app/cradlen-patient/commit/91d0ba84088a0dc1768ec7f69b96930450357229))
* **layout:** stop py-4 overriding pb-32 on portal scroll area ([5b2988c](https://github.com/cradlen-app/cradlen-patient/commit/5b2988c3cc4960f064aaff8d4f3409cf2e1e7faf))
* **layout:** stop py-4 overriding pb-32 on portal scroll area ([4773c09](https://github.com/cradlen-app/cradlen-patient/commit/4773c09173b1aaea56f7b06d6211ddf0d21a2ee0))
* **portal:** lock app shell to viewport and block credential autofill ([d0c6499](https://github.com/cradlen-app/cradlen-patient/commit/d0c64998b4eaf51ac923b37c3edf362ab2e481d0))
* **portal:** lock app shell to viewport and block credential autofill ([7fc9387](https://github.com/cradlen-app/cradlen-patient/commit/7fc9387afc87b6cde9f708c0b875d2934f650999))
* **portal:** remove nested scroll causing stray window scrollbar ([fea5c81](https://github.com/cradlen-app/cradlen-patient/commit/fea5c81079e5508c880ad57fb42deb1b1ff5b9ea))
* **portal:** remove nested scroll causing stray window scrollbar ([40687fe](https://github.com/cradlen-app/cradlen-patient/commit/40687fe3beff3c21053b6ccfdbaad74c315403d8))
* **push:** resolve notification click deep-links to locale-prefixed patient routes ([d90ba8f](https://github.com/cradlen-app/cradlen-patient/commit/d90ba8fd7d062ff738f7deb347b2f384cc135007))
* **pwa:** escape apostrophe in offline page heading ([cd39045](https://github.com/cradlen-app/cradlen-patient/commit/cd390456050baa606ddb220cfeef84f0af5350c6))
* **pwa:** make NetworkOnly patient-API guard actually fire (no PHI cache) ([fb15bd6](https://github.com/cradlen-app/cradlen-patient/commit/fb15bd6e643b81d9e3ae42f09bbbe010f5facb17))
* **pwa:** name install "Cradlen Patient" + solid kangaroo icon ([42ab6a1](https://github.com/cradlen-app/cradlen-patient/commit/42ab6a162d5a02ae37abdc0d78883badc413022a))
* **pwa:** name install "Cradlen Patient" + solid kangaroo icon ([a00cea7](https://github.com/cradlen-app/cradlen-patient/commit/a00cea7c3d532d66dc6fd49c8825d6baf84433d7))
* **pwa:** split offline e2e to skip-on-dev and harden patient-API path guard ([49a7a7e](https://github.com/cradlen-app/cradlen-patient/commit/49a7a7e47c93ad62e0b1f4535dae447979da5b00))
* **ui:** use logical RTL utilities and add TodayCard loading state ([2843d37](https://github.com/cradlen-app/cradlen-patient/commit/2843d37a35bd3f164d288b4181e8763eb3d6b37d))


### Refactoring

* **auth:** trim auth-transport to patient-only and harden backend ([eaaf9d8](https://github.com/cradlen-app/cradlen-patient/commit/eaaf9d880c62c75efb40ef63df461e87fcd2fc74))
* **portal:** remove version line from profile screen ([1558c49](https://github.com/cradlen-app/cradlen-patient/commit/1558c4988bc0014acc14e073ff6d78b3a83c1943))
* production-readiness pass for the patient portal ([151da9d](https://github.com/cradlen-app/cradlen-patient/commit/151da9d10ab7c6035e98894361932f2d2666f3ee))
* production-readiness pass for the patient portal ([85a95a1](https://github.com/cradlen-app/cradlen-patient/commit/85a95a120ea24e6cc0bc99840e31d6bfa1ebb245))

## [1.5.0](https://github.com/cradlen-app/cradlen-patient/compare/cradlen-patient-v1.4.0...cradlen-patient-v1.5.0) (2026-06-30)


### Features

* add Sentry error monitoring with PII scrubbing ([db2b7a6](https://github.com/cradlen-app/cradlen-patient/commit/db2b7a63ab4a5faeb3693363856c97bd022101d3))
* add Sentry error monitoring with PII scrubbing ([bf3b861](https://github.com/cradlen-app/cradlen-patient/commit/bf3b8610d1ee7aa99599a6249f68be196b8747d5))
* **patient-portal:** allow patients to change their national ID ([3fc27ce](https://github.com/cradlen-app/cradlen-patient/commit/3fc27ce983f562b9113ff6550f32bef2b914810d))
* **patient-portal:** allow patients to change their national ID ([e58c6dd](https://github.com/cradlen-app/cradlen-patient/commit/e58c6ddb33f34d4488aabe160029760fe5dc84ef))
* **security:** add baseline security headers ([a0521ce](https://github.com/cradlen-app/cradlen-patient/commit/a0521ce4d2f0e73df6fa315e969604ff1954209a))
* **security:** enforce nonce-based CSP via middleware ([e9ad41c](https://github.com/cradlen-app/cradlen-patient/commit/e9ad41c800c897e730eb57cbd199dae8a54762b8))
* **signin:** link logo to landing site, enlarge forgot-password link ([39b8f09](https://github.com/cradlen-app/cradlen-patient/commit/39b8f099c4efed97b357cac46bb39f5e7ef5e3e5))
* **signin:** link logo to landing site, enlarge forgot-password link ([fa454f4](https://github.com/cradlen-app/cradlen-patient/commit/fa454f485aa74aebab5e16bff4020f8c21d536b5))
* **versioning:** in-app version display + new-deploy update prompts ([5856f3f](https://github.com/cradlen-app/cradlen-patient/commit/5856f3f73ce955c77191e791f1d5750206d38cfa))
* **versioning:** show app version in mobile More drawer ([21af444](https://github.com/cradlen-app/cradlen-patient/commit/21af444b7145925724134f8705000d0e1f4e3429))
* **versioning:** show app version in mobile More drawer ([4a4e6c2](https://github.com/cradlen-app/cradlen-patient/commit/4a4e6c20ca979a615bd9d31f22e7bc05efc5a094))
* **versioning:** show app version on patient profile screen ([f570d43](https://github.com/cradlen-app/cradlen-patient/commit/f570d4371371cf492599191eb72ba357ac12a7d4))


### Bug Fixes

* **deps:** resolve high-severity vulnerabilities ([a05800e](https://github.com/cradlen-app/cradlen-patient/commit/a05800eb49abc4e6b0baef88391324b69e7672c5))
* **footer:** point content links to marketing site to avoid 404s ([88ae528](https://github.com/cradlen-app/cradlen-patient/commit/88ae52831e9b075677d63f2adab690690b5e371b))
* **footer:** point content links to marketing site to avoid 404s ([d3f2ca7](https://github.com/cradlen-app/cradlen-patient/commit/d3f2ca7200bfab378d7b81323538e1fc1079ce98))
* **home:** keep TodayCard in its loading state during identity resolve ([ff22c6c](https://github.com/cradlen-app/cradlen-patient/commit/ff22c6c5aa6ea199dd0ca2932d9a17cc1de59bb6))
* **portal:** lock app shell to viewport and block credential autofill ([d0c6499](https://github.com/cradlen-app/cradlen-patient/commit/d0c64998b4eaf51ac923b37c3edf362ab2e481d0))
* **portal:** lock app shell to viewport and block credential autofill ([7fc9387](https://github.com/cradlen-app/cradlen-patient/commit/7fc9387afc87b6cde9f708c0b875d2934f650999))
* **portal:** remove nested scroll causing stray window scrollbar ([fea5c81](https://github.com/cradlen-app/cradlen-patient/commit/fea5c81079e5508c880ad57fb42deb1b1ff5b9ea))
* **portal:** remove nested scroll causing stray window scrollbar ([40687fe](https://github.com/cradlen-app/cradlen-patient/commit/40687fe3beff3c21053b6ccfdbaad74c315403d8))
* **ui:** use logical RTL utilities and add TodayCard loading state ([2843d37](https://github.com/cradlen-app/cradlen-patient/commit/2843d37a35bd3f164d288b4181e8763eb3d6b37d))


### Refactoring

* **auth:** trim auth-transport to patient-only and harden backend ([eaaf9d8](https://github.com/cradlen-app/cradlen-patient/commit/eaaf9d880c62c75efb40ef63df461e87fcd2fc74))
* **portal:** remove version line from profile screen ([1558c49](https://github.com/cradlen-app/cradlen-patient/commit/1558c4988bc0014acc14e073ff6d78b3a83c1943))
* production-readiness pass for the patient portal ([151da9d](https://github.com/cradlen-app/cradlen-patient/commit/151da9d10ab7c6035e98894361932f2d2666f3ee))
* production-readiness pass for the patient portal ([85a95a1](https://github.com/cradlen-app/cradlen-patient/commit/85a95a120ea24e6cc0bc99840e31d6bfa1ebb245))

## [1.4.0](https://github.com/cradlen-app/cradlen-patient/compare/cradlen-patient-v1.3.0...cradlen-patient-v1.4.0) (2026-06-30)


### Features

* add Sentry error monitoring with PII scrubbing ([db2b7a6](https://github.com/cradlen-app/cradlen-patient/commit/db2b7a63ab4a5faeb3693363856c97bd022101d3))
* add Sentry error monitoring with PII scrubbing ([bf3b861](https://github.com/cradlen-app/cradlen-patient/commit/bf3b8610d1ee7aa99599a6249f68be196b8747d5))
* **patient-portal:** allow patients to change their national ID ([3fc27ce](https://github.com/cradlen-app/cradlen-patient/commit/3fc27ce983f562b9113ff6550f32bef2b914810d))
* **patient-portal:** allow patients to change their national ID ([e58c6dd](https://github.com/cradlen-app/cradlen-patient/commit/e58c6ddb33f34d4488aabe160029760fe5dc84ef))
* **security:** add baseline security headers ([a0521ce](https://github.com/cradlen-app/cradlen-patient/commit/a0521ce4d2f0e73df6fa315e969604ff1954209a))
* **security:** enforce nonce-based CSP via middleware ([e9ad41c](https://github.com/cradlen-app/cradlen-patient/commit/e9ad41c800c897e730eb57cbd199dae8a54762b8))
* **signin:** link logo to landing site, enlarge forgot-password link ([39b8f09](https://github.com/cradlen-app/cradlen-patient/commit/39b8f099c4efed97b357cac46bb39f5e7ef5e3e5))
* **signin:** link logo to landing site, enlarge forgot-password link ([fa454f4](https://github.com/cradlen-app/cradlen-patient/commit/fa454f485aa74aebab5e16bff4020f8c21d536b5))
* **versioning:** in-app version display + new-deploy update prompts ([5856f3f](https://github.com/cradlen-app/cradlen-patient/commit/5856f3f73ce955c77191e791f1d5750206d38cfa))
* **versioning:** show app version in mobile More drawer ([21af444](https://github.com/cradlen-app/cradlen-patient/commit/21af444b7145925724134f8705000d0e1f4e3429))
* **versioning:** show app version in mobile More drawer ([4a4e6c2](https://github.com/cradlen-app/cradlen-patient/commit/4a4e6c20ca979a615bd9d31f22e7bc05efc5a094))
* **versioning:** show app version on patient profile screen ([f570d43](https://github.com/cradlen-app/cradlen-patient/commit/f570d4371371cf492599191eb72ba357ac12a7d4))


### Bug Fixes

* **deps:** resolve high-severity vulnerabilities ([a05800e](https://github.com/cradlen-app/cradlen-patient/commit/a05800eb49abc4e6b0baef88391324b69e7672c5))
* **footer:** point content links to marketing site to avoid 404s ([88ae528](https://github.com/cradlen-app/cradlen-patient/commit/88ae52831e9b075677d63f2adab690690b5e371b))
* **footer:** point content links to marketing site to avoid 404s ([d3f2ca7](https://github.com/cradlen-app/cradlen-patient/commit/d3f2ca7200bfab378d7b81323538e1fc1079ce98))
* **home:** keep TodayCard in its loading state during identity resolve ([ff22c6c](https://github.com/cradlen-app/cradlen-patient/commit/ff22c6c5aa6ea199dd0ca2932d9a17cc1de59bb6))
* **portal:** lock app shell to viewport and block credential autofill ([d0c6499](https://github.com/cradlen-app/cradlen-patient/commit/d0c64998b4eaf51ac923b37c3edf362ab2e481d0))
* **portal:** lock app shell to viewport and block credential autofill ([7fc9387](https://github.com/cradlen-app/cradlen-patient/commit/7fc9387afc87b6cde9f708c0b875d2934f650999))
* **portal:** remove nested scroll causing stray window scrollbar ([fea5c81](https://github.com/cradlen-app/cradlen-patient/commit/fea5c81079e5508c880ad57fb42deb1b1ff5b9ea))
* **portal:** remove nested scroll causing stray window scrollbar ([40687fe](https://github.com/cradlen-app/cradlen-patient/commit/40687fe3beff3c21053b6ccfdbaad74c315403d8))
* **ui:** use logical RTL utilities and add TodayCard loading state ([2843d37](https://github.com/cradlen-app/cradlen-patient/commit/2843d37a35bd3f164d288b4181e8763eb3d6b37d))


### Refactoring

* **auth:** trim auth-transport to patient-only and harden backend ([eaaf9d8](https://github.com/cradlen-app/cradlen-patient/commit/eaaf9d880c62c75efb40ef63df461e87fcd2fc74))
* **portal:** remove version line from profile screen ([1558c49](https://github.com/cradlen-app/cradlen-patient/commit/1558c4988bc0014acc14e073ff6d78b3a83c1943))
* production-readiness pass for the patient portal ([151da9d](https://github.com/cradlen-app/cradlen-patient/commit/151da9d10ab7c6035e98894361932f2d2666f3ee))
* production-readiness pass for the patient portal ([85a95a1](https://github.com/cradlen-app/cradlen-patient/commit/85a95a120ea24e6cc0bc99840e31d6bfa1ebb245))

## [1.3.0](https://github.com/cradlen-app/cradlen-patient/compare/cradlen-patient-v1.2.0...cradlen-patient-v1.3.0) (2026-06-30)


### Features

* add Sentry error monitoring with PII scrubbing ([db2b7a6](https://github.com/cradlen-app/cradlen-patient/commit/db2b7a63ab4a5faeb3693363856c97bd022101d3))
* add Sentry error monitoring with PII scrubbing ([bf3b861](https://github.com/cradlen-app/cradlen-patient/commit/bf3b8610d1ee7aa99599a6249f68be196b8747d5))
* **security:** add baseline security headers ([a0521ce](https://github.com/cradlen-app/cradlen-patient/commit/a0521ce4d2f0e73df6fa315e969604ff1954209a))
* **security:** enforce nonce-based CSP via middleware ([e9ad41c](https://github.com/cradlen-app/cradlen-patient/commit/e9ad41c800c897e730eb57cbd199dae8a54762b8))
* **signin:** link logo to landing site, enlarge forgot-password link ([39b8f09](https://github.com/cradlen-app/cradlen-patient/commit/39b8f099c4efed97b357cac46bb39f5e7ef5e3e5))
* **signin:** link logo to landing site, enlarge forgot-password link ([fa454f4](https://github.com/cradlen-app/cradlen-patient/commit/fa454f485aa74aebab5e16bff4020f8c21d536b5))
* **versioning:** in-app version display + new-deploy update prompts ([5856f3f](https://github.com/cradlen-app/cradlen-patient/commit/5856f3f73ce955c77191e791f1d5750206d38cfa))
* **versioning:** show app version in mobile More drawer ([21af444](https://github.com/cradlen-app/cradlen-patient/commit/21af444b7145925724134f8705000d0e1f4e3429))
* **versioning:** show app version in mobile More drawer ([4a4e6c2](https://github.com/cradlen-app/cradlen-patient/commit/4a4e6c20ca979a615bd9d31f22e7bc05efc5a094))
* **versioning:** show app version on patient profile screen ([f570d43](https://github.com/cradlen-app/cradlen-patient/commit/f570d4371371cf492599191eb72ba357ac12a7d4))


### Bug Fixes

* **deps:** resolve high-severity vulnerabilities ([a05800e](https://github.com/cradlen-app/cradlen-patient/commit/a05800eb49abc4e6b0baef88391324b69e7672c5))
* **footer:** point content links to marketing site to avoid 404s ([88ae528](https://github.com/cradlen-app/cradlen-patient/commit/88ae52831e9b075677d63f2adab690690b5e371b))
* **footer:** point content links to marketing site to avoid 404s ([d3f2ca7](https://github.com/cradlen-app/cradlen-patient/commit/d3f2ca7200bfab378d7b81323538e1fc1079ce98))
* **home:** keep TodayCard in its loading state during identity resolve ([ff22c6c](https://github.com/cradlen-app/cradlen-patient/commit/ff22c6c5aa6ea199dd0ca2932d9a17cc1de59bb6))
* **portal:** lock app shell to viewport and block credential autofill ([d0c6499](https://github.com/cradlen-app/cradlen-patient/commit/d0c64998b4eaf51ac923b37c3edf362ab2e481d0))
* **portal:** lock app shell to viewport and block credential autofill ([7fc9387](https://github.com/cradlen-app/cradlen-patient/commit/7fc9387afc87b6cde9f708c0b875d2934f650999))
* **portal:** remove nested scroll causing stray window scrollbar ([fea5c81](https://github.com/cradlen-app/cradlen-patient/commit/fea5c81079e5508c880ad57fb42deb1b1ff5b9ea))
* **portal:** remove nested scroll causing stray window scrollbar ([40687fe](https://github.com/cradlen-app/cradlen-patient/commit/40687fe3beff3c21053b6ccfdbaad74c315403d8))
* **ui:** use logical RTL utilities and add TodayCard loading state ([2843d37](https://github.com/cradlen-app/cradlen-patient/commit/2843d37a35bd3f164d288b4181e8763eb3d6b37d))


### Refactoring

* **auth:** trim auth-transport to patient-only and harden backend ([eaaf9d8](https://github.com/cradlen-app/cradlen-patient/commit/eaaf9d880c62c75efb40ef63df461e87fcd2fc74))
* **portal:** remove version line from profile screen ([1558c49](https://github.com/cradlen-app/cradlen-patient/commit/1558c4988bc0014acc14e073ff6d78b3a83c1943))
* production-readiness pass for the patient portal ([151da9d](https://github.com/cradlen-app/cradlen-patient/commit/151da9d10ab7c6035e98894361932f2d2666f3ee))
* production-readiness pass for the patient portal ([85a95a1](https://github.com/cradlen-app/cradlen-patient/commit/85a95a120ea24e6cc0bc99840e31d6bfa1ebb245))

## [1.2.0](https://github.com/cradlen-app/cradlen-patient/compare/cradlen-patient-v1.1.0...cradlen-patient-v1.2.0) (2026-06-30)


### Features

* add Sentry error monitoring with PII scrubbing ([db2b7a6](https://github.com/cradlen-app/cradlen-patient/commit/db2b7a63ab4a5faeb3693363856c97bd022101d3))
* add Sentry error monitoring with PII scrubbing ([bf3b861](https://github.com/cradlen-app/cradlen-patient/commit/bf3b8610d1ee7aa99599a6249f68be196b8747d5))
* **security:** add baseline security headers ([a0521ce](https://github.com/cradlen-app/cradlen-patient/commit/a0521ce4d2f0e73df6fa315e969604ff1954209a))
* **security:** enforce nonce-based CSP via middleware ([e9ad41c](https://github.com/cradlen-app/cradlen-patient/commit/e9ad41c800c897e730eb57cbd199dae8a54762b8))
* **signin:** link logo to landing site, enlarge forgot-password link ([39b8f09](https://github.com/cradlen-app/cradlen-patient/commit/39b8f099c4efed97b357cac46bb39f5e7ef5e3e5))
* **signin:** link logo to landing site, enlarge forgot-password link ([fa454f4](https://github.com/cradlen-app/cradlen-patient/commit/fa454f485aa74aebab5e16bff4020f8c21d536b5))
* **versioning:** in-app version display + new-deploy update prompts ([5856f3f](https://github.com/cradlen-app/cradlen-patient/commit/5856f3f73ce955c77191e791f1d5750206d38cfa))
* **versioning:** show app version in mobile More drawer ([21af444](https://github.com/cradlen-app/cradlen-patient/commit/21af444b7145925724134f8705000d0e1f4e3429))
* **versioning:** show app version in mobile More drawer ([4a4e6c2](https://github.com/cradlen-app/cradlen-patient/commit/4a4e6c20ca979a615bd9d31f22e7bc05efc5a094))
* **versioning:** show app version on patient profile screen ([f570d43](https://github.com/cradlen-app/cradlen-patient/commit/f570d4371371cf492599191eb72ba357ac12a7d4))


### Bug Fixes

* **footer:** point content links to marketing site to avoid 404s ([88ae528](https://github.com/cradlen-app/cradlen-patient/commit/88ae52831e9b075677d63f2adab690690b5e371b))
* **footer:** point content links to marketing site to avoid 404s ([d3f2ca7](https://github.com/cradlen-app/cradlen-patient/commit/d3f2ca7200bfab378d7b81323538e1fc1079ce98))
* **home:** keep TodayCard in its loading state during identity resolve ([ff22c6c](https://github.com/cradlen-app/cradlen-patient/commit/ff22c6c5aa6ea199dd0ca2932d9a17cc1de59bb6))
* **portal:** remove nested scroll causing stray window scrollbar ([fea5c81](https://github.com/cradlen-app/cradlen-patient/commit/fea5c81079e5508c880ad57fb42deb1b1ff5b9ea))
* **portal:** remove nested scroll causing stray window scrollbar ([40687fe](https://github.com/cradlen-app/cradlen-patient/commit/40687fe3beff3c21053b6ccfdbaad74c315403d8))
* **ui:** use logical RTL utilities and add TodayCard loading state ([2843d37](https://github.com/cradlen-app/cradlen-patient/commit/2843d37a35bd3f164d288b4181e8763eb3d6b37d))


### Refactoring

* **auth:** trim auth-transport to patient-only and harden backend ([eaaf9d8](https://github.com/cradlen-app/cradlen-patient/commit/eaaf9d880c62c75efb40ef63df461e87fcd2fc74))
* production-readiness pass for the patient portal ([151da9d](https://github.com/cradlen-app/cradlen-patient/commit/151da9d10ab7c6035e98894361932f2d2666f3ee))
* production-readiness pass for the patient portal ([85a95a1](https://github.com/cradlen-app/cradlen-patient/commit/85a95a120ea24e6cc0bc99840e31d6bfa1ebb245))

## [1.1.0](https://github.com/cradlen-app/cradlen-patient/compare/cradlen-patient-v1.0.0...cradlen-patient-v1.1.0) (2026-06-30)


### Features

* **security:** add baseline security headers ([a0521ce](https://github.com/cradlen-app/cradlen-patient/commit/a0521ce4d2f0e73df6fa315e969604ff1954209a))
* **security:** enforce nonce-based CSP via middleware ([e9ad41c](https://github.com/cradlen-app/cradlen-patient/commit/e9ad41c800c897e730eb57cbd199dae8a54762b8))
* **signin:** link logo to landing site, enlarge forgot-password link ([39b8f09](https://github.com/cradlen-app/cradlen-patient/commit/39b8f099c4efed97b357cac46bb39f5e7ef5e3e5))
* **signin:** link logo to landing site, enlarge forgot-password link ([fa454f4](https://github.com/cradlen-app/cradlen-patient/commit/fa454f485aa74aebab5e16bff4020f8c21d536b5))
* **versioning:** in-app version display + new-deploy update prompts ([5856f3f](https://github.com/cradlen-app/cradlen-patient/commit/5856f3f73ce955c77191e791f1d5750206d38cfa))
* **versioning:** show app version on patient profile screen ([f570d43](https://github.com/cradlen-app/cradlen-patient/commit/f570d4371371cf492599191eb72ba357ac12a7d4))


### Bug Fixes

* **footer:** point content links to marketing site to avoid 404s ([88ae528](https://github.com/cradlen-app/cradlen-patient/commit/88ae52831e9b075677d63f2adab690690b5e371b))
* **footer:** point content links to marketing site to avoid 404s ([d3f2ca7](https://github.com/cradlen-app/cradlen-patient/commit/d3f2ca7200bfab378d7b81323538e1fc1079ce98))
* **home:** keep TodayCard in its loading state during identity resolve ([ff22c6c](https://github.com/cradlen-app/cradlen-patient/commit/ff22c6c5aa6ea199dd0ca2932d9a17cc1de59bb6))
* **ui:** use logical RTL utilities and add TodayCard loading state ([2843d37](https://github.com/cradlen-app/cradlen-patient/commit/2843d37a35bd3f164d288b4181e8763eb3d6b37d))


### Refactoring

* **auth:** trim auth-transport to patient-only and harden backend ([eaaf9d8](https://github.com/cradlen-app/cradlen-patient/commit/eaaf9d880c62c75efb40ef63df461e87fcd2fc74))
* production-readiness pass for the patient portal ([151da9d](https://github.com/cradlen-app/cradlen-patient/commit/151da9d10ab7c6035e98894361932f2d2666f3ee))
* production-readiness pass for the patient portal ([85a95a1](https://github.com/cradlen-app/cradlen-patient/commit/85a95a120ea24e6cc0bc99840e31d6bfa1ebb245))
