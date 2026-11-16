// Golpes secretos: se a mensagem tiver uma destas palavras, a bolha ganha efeito (só visual, a mensagem segue igual)
export type ChatAttack = {
    word: string
    label: string
    kind: "dragonball" | "naruto" | "bleach"
}

export const ATTACKS: ChatAttack[] = [
    { word: "kamehameha", label: "KAMEHAMEHA!!!", kind: "dragonball" },
    { word: "genki dama", label: "GENKI DAMA!", kind: "dragonball" },
    { word: "over 9000", label: "IT'S OVER 9000!!!", kind: "dragonball" },
    { word: "rasengan", label: "RASENGAN!", kind: "naruto" },
    { word: "chidori", label: "CHIDORI!", kind: "naruto" },
    { word: "dattebayo", label: "DATTEBAYO!", kind: "naruto" },
    { word: "bankai", label: "BANKAI!", kind: "bleach" },
    { word: "getsuga", label: "GETSUGA TENSHOU!", kind: "bleach" },
    { word: "shunpo", label: "SHUNPO!", kind: "bleach" },
]

export function findAttack(text: string): ChatAttack | undefined {
    const lower = text.toLowerCase()

    return ATTACKS.find(attack => lower.includes(attack.word))
}
