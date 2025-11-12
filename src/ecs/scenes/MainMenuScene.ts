import { Entity, type AppScene, type World } from "@/types";
import MenuStateComponent from "../components/ui/MenuStateComponent";
import type { MainMenuUiState } from "@/stores/ui.types";
import { useUiStore } from "@/stores/ui.store";
import { MainMenuUiRenderSystem } from "../systems";
import MainMenuInputSystem from '../systems/core/input/MainMenuInputSystem';

export class MainMenuScene implements AppScene {
    onEnter(world: World): void {
        world.addEntity(
            new Entity()
            .addComponent(new MenuStateComponent('Start'))
        );

        const initialState: MainMenuUiState =  {
            currentSection: 'Main',
            type: 'MainMenu',
            selectedButton: 'Start',
            version: 'v1.0.0'
        };

        useUiStore.getState().transitionTo(initialState);
        world.addSystem(new MainMenuUiRenderSystem());
        world.addSystem(new MainMenuInputSystem());
    }
    onExit(world: World): void {
        world.removeSystem(MainMenuUiRenderSystem);
        world.removeSystem(MainMenuInputSystem);
    }

}