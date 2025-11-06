import type { Component } from "@/types";

/**
 * ECS "Component" to tag user ID for online battle
 */
export default class OnlineUserId implements Component {
    public readonly userId: string

    constructor(userId: string) {
        this.userId = userId;
    }
}