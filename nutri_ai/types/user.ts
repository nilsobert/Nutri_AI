import { validateNonNegative } from '@/lib/utils/validation';
import log from '../lib/logger';

// TODO: Add supported medical conditions later on
export enum MedicalCondition {
    None = "None",
}

export enum MotivationToTrackCalories {
    LoseWeight = "LoseWeight",
    LeadAHealthyLife = "LeadAHealthyLife",
    TrackMedicalCondition = "TrackMedicalCondition",
}

export interface IUser {
    name: string
    age: number
    medicalCondition: MedicalCondition
    weightKg: number
    motivation: MotivationToTrackCalories
    email: string
    password: string
}

export class User implements IUser {
    private _name: string
    private _age: number
    private _medicalCondition: MedicalCondition
    private _weightKg: number
    private _motivation: MotivationToTrackCalories
    private _email: string
    private _password: string

    constructor(params: {
        name: string
        age: number
        weightKg: number
        motivation: MotivationToTrackCalories
        email: string
        password: string
        medicalCondition: MedicalCondition
    }) {
        this._name = params.name;
        this._age = params.age;
        this._weightKg = params.weightKg;
        this._motivation = params.motivation;
        this._email = params.email;
        this._password = params.password;
        // Checks value on the left: if 'null' or 'undefined', sets medical condition to None, otherwise uses the value
        this._medicalCondition = params.medicalCondition ?? MedicalCondition.None;
    }

    /**
    * Getters and Setters
    */
    public get name(): string { return this._name; }
    public set name(name: string) { this._name = name; }

    public get age(): number { return this._age; }
    public set age(age: number) 
    { 
        validateNonNegative('age', age);
        this._age = age;
    }

    public get medicalCondition(): MedicalCondition { return this._medicalCondition; }
    public set medicalCondition(medicalCondition: MedicalCondition) {
        this._medicalCondition = medicalCondition;
    }

    public get weightKg(): number { return this._weightKg; }
    public set weightKg(weightKg: number) {
        validateNonNegative('weightKg', weightKg);
        this._weightKg = weightKg;
    }

    public get motivation(): MotivationToTrackCalories { return this._motivation; }
    public set motivation(motivation: MotivationToTrackCalories) { this._motivation = motivation; }

    public get email(): string { return this._email; }
    public set email(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email)) {
            this._email = email;
            return;
        }
        log.error("Invalid parameter email in user.ts.");
        throw new RangeError("Please enter a valid email address.");
    }

    public get password(): string { return this._password; }
    public set password(password: string) { this._password = password; }
}
