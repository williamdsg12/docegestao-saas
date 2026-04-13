/**
 * Utility for checking store operational status following iFood-standard logic.
 * SINGLE SOURCE OF TRUTH: Manual Override > calculated Schedule
 */

export type StoreStatusType = 'OPEN' | 'CLOSED' | 'PAUSED' | 'OUTSIDE_HOURS' | 'CLOSED_TODAY';

export interface DaySchedule {
    open: string;
    close: string;
}

export interface OpeningHours {
    monday: DaySchedule | null;
    tuesday: DaySchedule | null;
    wednesday: DaySchedule | null;
    thursday: DaySchedule | null;
    friday: DaySchedule | null;
    saturday: DaySchedule | null;
    sunday: DaySchedule | null;
    is_open_manual?: boolean; // Legacy
}

export interface StoreStatusResult {
    isOpen: boolean;
    isPaused: boolean;
    status: StoreStatusType;
    message: string;
    reason: string;
    source: 'manual' | 'schedule';
    nextOpening?: string;
}

/**
 * Calculates current store status.
 * Priority: 1. Manual Override | 2. Operational Schedule
 */
export function getStoreStatus(settings: any): StoreStatusResult {
    if (!settings) return { 
        isOpen: false, 
        isPaused: false,
        status: 'CLOSED', 
        message: "Dados não carregados",
        reason: "Configurações da loja não disponíveis",
        source: 'manual'
    };

    // 1. MANUAL OVERRIDE CHECK (Single Source of Truth)
    if (settings.is_manual_override) {
        const manualStatus = settings.manual_status || 'closed';
        
        if (manualStatus === 'open') {
            return {
                isOpen: true,
                isPaused: false,
                status: 'OPEN',
                message: "Loja Aberta",
                reason: "Abertura manual forçada pelo administrador.",
                source: 'manual'
            };
        }
        
        if (manualStatus === 'paused') {
            return {
                isOpen: false,
                isPaused: true,
                status: 'PAUSED',
                message: "Loja Pausada",
                reason: "Pausa temporária manual.",
                source: 'manual'
            };
        }

        return {
            isOpen: false,
            isPaused: false,
            status: 'CLOSED',
            message: "Loja Fechada",
            reason: "Fechamento manual forçado pelo administrador.",
            source: 'manual'
        };
    }

    // 2. SCHEDULE CHECK (Automatic Logic)
    const hours: OpeningHours = settings.opening_hours || {};
    const now = new Date();
    
    // Convert current time to GMT-3 (Brazil Standard Time) if needed, 
    // but for simple local checks we use the machine time which is usually set correctly.
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayName = dayNames[now.getDay()] as keyof OpeningHours;
    const todaySchedule = hours ? (hours[todayName] as DaySchedule) : null;

    if (!todaySchedule || !todaySchedule.open || !todaySchedule.close) {
        return {
            isOpen: false,
            isPaused: false,
            status: 'CLOSED_TODAY',
            message: "Fechado Hoje",
            reason: "Não atendemos neste dia da semana.",
            source: 'schedule'
        };
    }

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todaySchedule.open.split(":").map(Number);
    const [closeH, closeM] = todaySchedule.close.split(":").map(Number);
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;

    if (currentTime < openTime || currentTime > closeTime) {
        return {
            isOpen: false,
            isPaused: false,
            status: 'OUTSIDE_HOURS',
            message: `Abrimos às ${todaySchedule.open}`,
            reason: "Estamos fora do horário de atendimento automático.",
            source: 'schedule',
            nextOpening: todaySchedule.open
        };
    }

    // Default: WITHIN HOURS
    return {
        isOpen: true,
        isPaused: false,
        status: 'OPEN',
        message: "Loja Aberta",
        reason: "Dentro do horário de funcionamento automático.",
        source: 'schedule'
    };
}

// Legacy Alias for compatibility during migration
export const isStoreOpen = (settings: any) => getStoreStatus(settings);
