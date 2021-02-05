
export interface KeywordsJSON {
    labels: { [s: string]: number }
    keywords: string[]
    counter: { [s: string]: number }
    linked?: number[]
}