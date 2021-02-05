

export function isEnterKey(e: Event){
    return (e as KeyboardEvent).code == 'Enter';
}