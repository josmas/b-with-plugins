/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { blocks } from './blocks/text';
import { forBlock } from './generators/javascript';
import { javascriptGenerator } from 'blockly/javascript';
import { save, load } from './serialization';
import { toolbox } from './toolbox';
import { NavigationController } from '@blockly/keyboard-navigation';
import { createPlayground } from '@blockly/dev-tools';
import './index.css';
import { BlocklyOptions } from "blockly";

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById('generatedCode')?.firstChild;
const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');

if (!blocklyDiv) {
  throw new Error(`div with id 'blocklyDiv' not found`);
}

let ws: Blockly.WorkspaceSvg;

const navigationController = new NavigationController();

function createWorkspace(blocklyDiv: Element | string, options: BlocklyOptions) {
  ws = Blockly.inject(blocklyDiv, options);
  navigationController.init();
  navigationController.addWorkspace(ws);
  // Uncomment the following line to enable keyboard navigation by default. Otherwise,
  // you need to use Ctlr+Shift+K to enable it.
  // navigationController.enable(ws);
  if (ws) {
    // Load the initial state from storage and run the code.
    load(ws);
    runCode();

    // Every time the workspace changes state, save the changes to storage.
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      // UI events are things like scrolling, zooming, etc.
      // No need to save after one of these.
      if (e.isUiEvent) return;
      save(ws);
    });

    // Whenever the workspace changes meaningfully, run the code again.
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      // Don't run the code when the workspace finishes loading; we're
      // already running it once when the application starts.
      // Don't run the code during drags; we might have invalid state.
      if (
        e.isUiEvent ||
        e.type == Blockly.Events.FINISHED_LOADING ||
        ws.isDragging()
      ) {
        return;
      }
      runCode();
    });
  }
  return ws;
}

document.addEventListener('DOMContentLoaded', function () {
  createPlayground(
    blocklyDiv,
    createWorkspace,
    { toolbox, comments: true, renderer: 'zelos', zoom: { controls: true } },
  );
});

// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const runCode = () => {
  const code = javascriptGenerator.workspaceToCode(ws as Blockly.Workspace);
  if (codeDiv) codeDiv.textContent = code;

  if (outputDiv) outputDiv.innerHTML = '';

  eval(code);
};


