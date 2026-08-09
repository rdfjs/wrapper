import { EventfulDatasetCore } from "@jeswr/eventful-dataset"
import { Parser } from "n3"

export function eventfulDatasetFromRdf(rdf: string): EventfulDatasetCore {
    return new EventfulDatasetCore(new Parser().parse(rdf))
}
