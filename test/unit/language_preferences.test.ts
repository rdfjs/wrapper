import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import {
    LanguagePreferences,
    OptionalAs,
    OptionalFrom,
    RequiredAs,
    RequiredFrom,
    SetFrom,
    TermWrapper,
    languagesOf,
} from "@rdfjs/wrapper"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label"
const RDFS_DESCRIPTION = "http://www.w3.org/2000/01/rdf-schema#description"

const rdf = `
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>

<x>
    rdfs:label "Hospital" ;
    rdfs:label "Hôpital"@fr ;
    rdfs:label "병원"@ko ;
    rdfs:description "Heals patients" ;
    rdfs:description "Has doctors" ;
    rdfs:description "Guérit les malades"@fr ;
    rdfs:description "A des médecins"@fr ;
    rdfs:description "환자를 치료하다"@ko ;
    rdfs:description "의사 있음"@ko ;
.
`

await describe("LanguagePreferences", async () => {
    await describe("writeLanguage", async () => {
        await it("returns first non-@other tag", async () => {
            const prefs = new LanguagePreferences("es", "ko", "@none")
            assert.equal(prefs.writeLanguage, "es")
        })

        await it("skips @other", async () => {
            const prefs = new LanguagePreferences("@other", "fr")
            assert.equal(prefs.writeLanguage, "fr")
        })

        await it("returns empty string for @none", async () => {
            const prefs = new LanguagePreferences("@none", "fr")
            assert.equal(prefs.writeLanguage, "")
        })

        await it("returns empty string when all @other", async () => {
            const prefs = new LanguagePreferences("@other")
            assert.equal(prefs.writeLanguage, "")
        })

        await it("returns empty string when empty", async () => {
            const prefs = new LanguagePreferences()
            assert.equal(prefs.writeLanguage, "")
        })
    })

    await describe("matchesPreference", async () => {
        await it("@none matches empty language", async () => {
            const prefs = new LanguagePreferences("@none")
            assert.equal(prefs.matchesPreference("", "@none"), true)
        })

        await it("@none does not match non-empty language", async () => {
            const prefs = new LanguagePreferences("@none")
            assert.equal(prefs.matchesPreference("en", "@none"), false)
        })

        await it("@other matches unlisted language", async () => {
            const prefs = new LanguagePreferences("fr", "@other")
            assert.equal(prefs.matchesPreference("ko", "@other"), true)
        })

        await it("@other does not match listed language", async () => {
            const prefs = new LanguagePreferences("fr", "@other")
            assert.equal(prefs.matchesPreference("fr", "@other"), false)
        })

        await it("language tag matches case-insensitively", async () => {
            const prefs = new LanguagePreferences("EN")
            assert.equal(prefs.matchesPreference("en", "EN"), true)
        })
    })
})

await describe("RequiredFrom.subjectPredicateByLanguage", async () => {
    await it("reads best matching language (French first)", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("fr", "ko", "@none")

        assert.equal(RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs), "Hôpital")
    })

    await it("reads best matching language (Korean first)", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("ko", "fr", "@none")

        assert.equal(RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs), "병원")
    })

    await it("reads @none", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("@none")

        assert.equal(RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs), "Hospital")
    })

    await it("falls through to next preference", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("es", "fr", "@none")

        assert.equal(RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs), "Hôpital")
    })

    await it("reads @other matching unlisted language", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("@other", "fr")

        // @other should match ko or @none (not fr); order depends on dataset iteration
        const result = RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs)
        assert.notEqual(result, "Hôpital")
    })

    await it("throws when no match", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("zh")

        assert.throws(() => RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs))
    })
})

await describe("OptionalFrom.subjectPredicateByLanguage", async () => {
    await it("reads best matching language", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("fr", "ko")

        assert.equal(OptionalFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs), "Hôpital")
    })

    await it("returns undefined when no match", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("zh")

        assert.equal(OptionalFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs), undefined)
    })
})

await describe("RequiredAs.objectByLanguage", async () => {
    await it("writes with write language", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("es", "ko", "@none")

        RequiredAs.objectByLanguage(wrapper, RDFS_LABEL, "Hospital Español", prefs)
        assert.equal(RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs), "Hospital Español")
    })

    await it("throws when value is undefined", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("es")

        assert.throws(() => RequiredAs.objectByLanguage(wrapper, RDFS_LABEL, undefined as any, prefs))
    })

    await it("preserves other translations", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("es", "ko")

        RequiredAs.objectByLanguage(wrapper, RDFS_LABEL, "Hospital Español", prefs)

        // French and Korean should still be there
        const frPrefs = new LanguagePreferences("fr")
        assert.equal(RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, frPrefs), "Hôpital")
        const koPrefs = new LanguagePreferences("ko")
        assert.equal(RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, koPrefs), "병원")
    })
})

await describe("OptionalAs.objectByLanguage", async () => {
    await it("removes all langString quads when value is undefined", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("fr")

        OptionalAs.objectByLanguage(wrapper, RDFS_LABEL, undefined, prefs)

        // All language labels should be gone
        const anyPrefs = new LanguagePreferences("fr", "ko", "@none")
        assert.equal(OptionalFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, anyPrefs), undefined)
    })

    await it("replaces only write language quads", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("fr", "ko")

        OptionalAs.objectByLanguage(wrapper, RDFS_LABEL, "Nouvel Hôpital", prefs)

        assert.equal(RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs), "Nouvel Hôpital")

        // Korean should still be there
        const koPrefs = new LanguagePreferences("ko")
        assert.equal(RequiredFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, koPrefs), "병원")
    })
})

await describe("SetFrom.subjectPredicateByLanguage", async () => {
    await it("returns values of best matching language", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("ko", "fr", "@none")

        const descriptions = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_DESCRIPTION, prefs)
        assert.equal(descriptions.size, 2)
        assert.equal(descriptions.has("환자를 치료하다"), true)
        assert.equal(descriptions.has("의사 있음"), true)
    })

    await it("falls through to next preference", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("es", "fr", "@none")

        const descriptions = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_DESCRIPTION, prefs)
        assert.equal(descriptions.size, 2)
        assert.equal(descriptions.has("Guérit les malades"), true)
        assert.equal(descriptions.has("A des médecins"), true)
    })

    await it("reads @none values", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("@none")

        const descriptions = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_DESCRIPTION, prefs)
        assert.equal(descriptions.size, 2)
        assert.equal(descriptions.has("Heals patients"), true)
        assert.equal(descriptions.has("Has doctors"), true)
    })

    await it("add writes with write language", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("es", "ko", "@none")

        const descriptions = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_DESCRIPTION, prefs)
        descriptions.add("Cura a las pacientes")

        // Now Spanish exists, so it becomes the best match
        assert.equal(descriptions.size, 1)
        assert.equal(descriptions.has("Cura a las pacientes"), true)
    })

    await it("delete removes from best matching language", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("ko", "fr")

        const descriptions = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_DESCRIPTION, prefs)
        assert.equal(descriptions.size, 2)

        descriptions.delete("환자를 치료하다")
        assert.equal(descriptions.size, 1)
        assert.equal(descriptions.has("의사 있음"), true)
    })

    await it("clear removes all langString quads", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("ko", "fr", "@none")

        const descriptions = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_DESCRIPTION, prefs)
        descriptions.clear()

        // All languages should be gone
        const allPrefs = new LanguagePreferences("ko", "fr", "@none")
        const descAfter = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_DESCRIPTION, allPrefs)
        assert.equal(descAfter.size, 0)
    })

    await it("has checks best matching language", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("fr", "ko")

        const descriptions = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_DESCRIPTION, prefs)
        assert.equal(descriptions.has("Guérit les malades"), true)
        assert.equal(descriptions.has("환자를 치료하다"), false) // Korean not visible when French matches
    })

    await it("forEach iterates best matching language", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("fr")

        const descriptions = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_DESCRIPTION, prefs)
        const values: string[] = []
        descriptions.forEach(v => values.push(v))
        assert.equal(values.length, 2)
        assert.equal(values.includes("Guérit les malades"), true)
        assert.equal(values.includes("A des médecins"), true)
    })

    await it("entries yields [value, value] pairs", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)
        const prefs = new LanguagePreferences("@none")

        const labels = SetFrom.subjectPredicateByLanguage(wrapper, RDFS_LABEL, prefs)
        for (const [k, v] of labels.entries()) {
            assert.equal(k, v)
            assert.equal(k, "Hospital")
        }
    })
})

await describe("languagesOf", async () => {
    await it("returns all languages for a predicate", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)

        const langs = languagesOf(wrapper, RDFS_LABEL)
        assert.equal(langs.size, 3)
        assert.deepEqual(langs.get("@none"), ["Hospital"])
        assert.deepEqual(langs.get("fr"), ["Hôpital"])
        assert.deepEqual(langs.get("ko"), ["병원"])
    })

    await it("returns multiple values per language", async () => {
        const dataset = datasetFromRdf(rdf)
        const wrapper = new TermWrapper("x", dataset, DataFactory)

        const langs = languagesOf(wrapper, RDFS_DESCRIPTION)
        assert.equal(langs.size, 3)
        assert.equal(langs.get("@none")!.length, 2)
        assert.equal(langs.get("fr")!.length, 2)
        assert.equal(langs.get("ko")!.length, 2)
    })

    await it("returns empty map when no string quads", async () => {
        const dataset = datasetFromRdf(`
            prefix xsd: <http://www.w3.org/2001/XMLSchema#>
            <x> <http://example.com/p> "42"^^xsd:integer .
        `)
        const wrapper = new TermWrapper("x", dataset, DataFactory)

        const langs = languagesOf(wrapper, "http://example.com/p")
        assert.equal(langs.size, 0)
    })
})
