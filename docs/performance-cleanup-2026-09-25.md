# Performance cleanup — 2026-09-25

Scope is intentionally limited to site weight and runtime performance until the live site is responsive again.

Observed live homepage issues before this pass:
- five-image client-side 3D coverflow above the fold;
- ten-image inspiration gallery, with the first six images eager-loaded;
- repeated category imagery reused again in guide cards and gallery sections;
- multiple large Unsplash requests around 1200–1400px at quality 82–85;
- retired WebGL hero code and Three.js dependencies still present in the repository;
- an empty demo Featured section still imported on the homepage.

Changes in this pass:
- replaced the 3D coverflow with one responsive hero image;
- reduced inspiration images from 10 to 4 and lazy-loaded all of them;
- removed guide-card images from the homepage;
- made category images responsive and smaller;
- removed the empty Featured section;
- removed retired coverflow and WebGL hero components;
- removed unused React Three Fiber / Drei / Three.js dependencies.

No SEO/content expansion work is in scope until performance cleanup is verified on production.
