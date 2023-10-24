# reac README

regexp-based auto correction. Auto-corrects typ0s using regexp-base rules, with extended flags which allow for case preservation and transformation.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

## Extension Settings

The reac.replacers setting contains all of the rules for auto-correct.

First, the language of the current file is matched against all "languages" regexps, in order. So in the example below, a markdown file would use the first and the third block. A C file would use the first and the second.

"patterns" is a list of lists containing the patterns to match, their replace text and any flags. This is very similar to the usual regexp s// syntax, but the flags item has additional options, and the usual regexp flags are limited to the applicable ones:

### Flags
- Standard Regexp Flags
  - g: global replace; usually it's just first match. you should probably combine with 's' below
  - i: case-insensitive match
- Additional
  - s: substring; by default, all patterns are wrapped in ^/$ to force a full string match. this prevents that behaviour
  - u: transform replacement to UPPERcase after replacement regardles of starting case
  - l: transform replacement to lowercase after replacement regardles of starting case
  - t: transform replacement to Titlecase after replacement regardles of starting case
  - p: preserve case. If Teh is typed, it will be corrected as The. teh=the TEH=THE

Any list-items following the 3rd one are ignored. In the examples below with 4 items, the 4th is a "comment" (helps with debugging sometimes)
```

"reac.replacers": [
    {
        "languages": [
            ".*"
        ],
        "patterns": [
            [
                "[A-Z]{2}[a-z]+",
                "$&",
                "t",
                "FIxes my HEavy SHift KEy"
            ]
        ]
    },
    {
        "languages": [
            "(java|type)script(react)?|c(pp|sharp)?"
        ],
        "patterns": [
            [
                "pirate",
                "private",
            ]
        ]
    },
    {
        "languages": [
            "markdown|plaintext"
        ],
        "patterns": [
            [
                "([bnmst])a",
                "a$1",
                "ip"
            ]
        ]
    }
]
```

## Known Issues / TODO

- I would prefer to match the current scope, instead of/in addition to, language, but AFAIK, VSC doesn't expose this... yet? I may look into 3rd party solutions for this in the future.
- Need to make auto-correction trigger characters (currently non-word chars (/\W/))
- Need to make pattern for selecting the previous word configurable (currentl word chars (\w+))
- Fix typ0s in this file

## Release Notes

### 1.0.0
Initial release.
