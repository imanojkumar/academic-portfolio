# Profile images

Place your profile photograph here as:

    assets/img/profile/manoj-kumar.jpg

Then set it in `content/profile.json`:

    "hero": { "photo": "assets/img/profile/manoj-kumar.jpg", ... }

Recommended: a square image, at least 400x400 px. The page renders it in a
circular frame and falls back to your initials if the file is missing or the
`photo` field is left empty.

`default-avatar.svg` is a neutral stand-in and is not used unless you
reference it explicitly.
