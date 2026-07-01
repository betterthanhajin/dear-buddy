export type buddy = {
    id: string;
    name:string;
    level:number;
    exp:number;
    hunger:number;
    mood: 'happy' | 'sleep' | 'sad';
    image: string;
};
