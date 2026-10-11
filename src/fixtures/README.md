`catalog.official.json` is the working copy of the vendor dump. The sole source-file edit is removal of the trailing comma that made the supplied file invalid strict JSON. No catalog field values were intentionally changed.

The loader preserves `modifiers.mod_patty.external_ref` as an exact string at the application boundary because its numeric token (9007199254740993) is outside JavaScript's safe integer range. The original fixtures are in the assignment archive.
