import type { MainMenuUiState } from "@/stores/ui.types";
import type { Component } from "@/types";

export default class MenuStateComponent implements Component {
    public selectedButton: MainMenuUiState['selectedButton'] = 'Start'
    constructor(selectedButton: MainMenuUiState['selectedButton']) {
        this.selectedButton = selectedButton;
    }
}