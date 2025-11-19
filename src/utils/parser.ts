import type { From } from "@/types";
import { RoomIdPatterns, type CreateRoomRequest, type RoomId } from "@/types/room-manager.types";
import { err, ok, type Result } from '../types/result';

export function parseBoolean(value: string | undefined) {
    return value?.toLowerCase() === 'true';
}

export const RoomIdParser: From<string, Result<RoomId, Error>> = {
    from: (value) => {
        const trimmedValue = value.trim();

        // try to match general room format
        const generalMatch = trimmedValue.match(RoomIdPatterns.GENERAL);;
        if (generalMatch) {
            return ok({
                type: 'general',
                id: trimmedValue,
            });
        }

        // try to match discord room format
        const discordMatch = trimmedValue.match(RoomIdPatterns.DISCORD);
        if (discordMatch) {
            return ok({
                type: 'discord',
                guildId: discordMatch[1],
                channelId: discordMatch[2],
            });
        }

        return err(new Error('String does not match any known RoomId patterns.'));
    },
}

// Utility function to create room ID strings from RoomId objects
export function createRoomIdString(roomId: RoomId): string {
    if (roomId.type === 'general') {
        return `general_${roomId.id}`;
    } else if (roomId.type === 'discord') {
        if (!roomId.guildId || !roomId.channelId) {
            throw new Error('Discord room IDs require both guildId and channelId');
        }
        return `discord_${roomId.guildId}-${roomId.channelId}`;
    }
    throw new Error('Unknown room type');
}

// Utility function to validate if a string is a valid room ID
export function isValidRoomId(value: string): boolean {
    const result = RoomIdParser.from(value);
    return result.ok;
}