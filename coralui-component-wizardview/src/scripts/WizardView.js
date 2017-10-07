/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2017 Adobe Systems Incorporated
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */

import Component from 'coralui-mixin-component';
import {Collection} from 'coralui-collection';
import 'coralui-component-steplist';
import 'coralui-component-panelstack';
import {commons} from 'coralui-util';

const CLASSNAME = 'coral3-WizardView';

/**
 @class Coral.WizardView
 @classdesc A WizardView component
 @htmltag coral-wizardview
 @extends HTMLElement
 @extends Coral.mixin.component
 */
class WizardView extends Component(HTMLElement) {
  constructor() {
    super();
  
    this._delegateEvents({
      'coral-steplist:change coral-steplist[coral-wizardview-steplist]': '_onStepListChange',
      'click [coral-wizardview-previous]': '_onPreviousClick',
      'click [coral-wizardview-next]': '_onNextClick'
    });
  
    // Init the collection mutation observer
    this.stepLists._startHandlingItems(true);
    this.panelStacks._startHandlingItems(true);
  }
  
  /**
   The set of controlled PanelStacks. Each PanelStack must have the
   <code>coral-wizardview-panelstack</code> attribute.
   
   See {@link Coral.Collection} for more details regarding collection APIs.
   
   @type {Coral.Collection}
   @readonly
   @memberof Coral.WizardView#
   */
  get panelStacks() {
    // Construct the collection on first request:
    if (!this._panelStacks) {
      this._panelStacks = new Collection({
        host: this,
        itemTagName: 'coral-panelstack',
        // allows panelstack to be nested
        itemSelector: ':scope > coral-panelstack[coral-wizardview-panelstack]',
        onItemAdded: this._onItemAdded
      });
    }
  
    return this._panelStacks;
  }
  
  /**
   The set of controlling StepLists. Each StepList must have the <code>coral-wizardview-steplist</code> attribute.
   
   See {@link Coral.Collection} for more details regarding collection APIs.
   
   @type {Coral.Collection}
   @readonly
   @memberof Coral.WizardView#
   */
  get stepLists() {
    // Construct the collection on first request:
    if (!this._stepLists) {
      this._stepLists = new Collection({
        host: this,
        itemTagName: 'coral-steplist',
        // allows steplist to be nested
        itemSelector: ':scope > coral-steplist[coral-wizardview-steplist]',
        onItemAdded: this._onItemAdded
      });
    }
  
    return this._stepLists;
  }
  
  /**
   Called by the Collection when an item is added
   
   @private
   */
  _onItemAdded(item) {
    this._selectItemByIndex(item, this._getSelectedIndex());
  }
  
  /**
   Handles the next button click.
   
   @private
   */
  _onNextClick(event) {
    // we stop propagation in case the wizard views are nested
    event.stopPropagation();
    
    this.next();
  }
  
  /**
   Handles the previous button click.
   
   @private
   */
  _onPreviousClick(event) {
    // we stop propagation in case the wizard views are nested
    event.stopPropagation();
    
    this.previous();
  }
  
  /**
   Detects a change in the StepList and triggers an event.
   
   @private
   */
  _onStepListChange(event) {
    // Stop propagation of the events to support nested panels
    event.stopPropagation();
    
    // Get the step number
    const index = event.target.items.getAll().indexOf(event.detail.selection);
    
    // Sync the other StepLists
    this._selectStep(index);
    
    this.trigger('coral-wizardview:change', {
      selection: event.detail.selection,
      oldSelection: event.detail.oldSelection
    });
  }
  
  /** @private */
  _getSelectedIndex() {
    const stepList = this.stepLists.first();
    if (!stepList) {
      return -1;
    }
    
    let stepIndex = -1;
    if (stepList.items) {
      stepIndex = stepList.items.getAll().indexOf(stepList.selectedItem);
    }
    else {
      // Manually get the selected step
      const steps = stepList.querySelectorAll('coral-step');
      
      // Find the last selected step
      for (let i = steps.length - 1; i >= 0; i--) {
        if (steps[i].hasAttribute('selected')) {
          stepIndex = i;
          break;
        }
      }
    }
    
    return stepIndex;
  }
  
  /**
   Select the step according to the provided index.
   
   @param {*} component
   The StepList or PanelStack to select the step on.
   @param {Number} index
   The index of the step that should be selected.
   
   @private
   */
  _selectItemByIndex(component, index) {
    let item = null;
    
    // we need to set an id to be able to find direct children
    component.id = component.id || commons.getUID();
    
    // if collection api is available we use it to find the correct item
    if (component.items) {
      // Get the corresponding item
      item = component.items.getAll()[index];
    }
    // Resort to querying manually on immediately children
    else if (component.tagName === 'CORAL-STEPLIST') {
      // @polyfill IE - we use id since :scope is not supported
      item = component.querySelectorAll(`#${component.id} > coral-step`)[index];
    }
    else if (component.tagName === 'CORAL-PANELSTACK') {
      // @polyfill IE - we use id since :scope is not supported
      item = component.querySelectorAll(`#${component.id} > coral-panel`)[index];
    }
    
    if (item) {
      // we only select if not select to avoid mutations
      if (!item.hasAttribute('selected')) {
        item.setAttribute('selected', '');
      }
    }
    // if we did not find an item to select, it means that the "index" is not available in the component, therefore we
    // need to deselect all items
    else {
      // we use the component id to be able to find direct children
      if (component.tagName === 'CORAL-STEPLIST') {
        // @polyfill IE - we use id since :scope is not supported
        item = component.querySelector(`#${component.id} > coral-step[selected]`);
      }
      else if (component.tagName === 'CORAL-PANELSTACK') {
        // @polyfill IE - we use id since :scope is not supported
        item = component.querySelector(`#${component.id} > coral-panel[selected]`);
      }
      
      if (item) {
        item.removeAttribute('selected');
      }
    }
  }
  
  /** @private */
  _selectStep(index) {
    // we apply the selection to all available steplists
    this.stepLists.getAll().forEach((stepList) => {
      this._selectItemByIndex(stepList, index);
    }, this);
    
    // we apply the selection to all available panelstacks
    this.panelStacks.getAll().forEach((panelStack) => {
      this._selectItemByIndex(panelStack, index);
    }, this);
  }
  
  /**
   Sets the correct selected item in every PanelStack.
   
   @private
   */
  _syncPanelStackSelection(defaultIndex) {
    // Find out which step we're on by checking the first StepList
    let index = this._getSelectedIndex();
    
    if (index === -1) {
      if (typeof defaultIndex !== 'undefined') {
        index = defaultIndex;
      }
      else {
        // No panel selected
        return;
      }
    }
    
    this.panelStacks.getAll().forEach((panelStack) => {
      this._selectItemByIndex(panelStack, index);
    }, this);
  }
  
  /**
   Selects the correct step in every StepList.
   
   @private
   */
  _syncStepListSelection(defaultIndex) {
    // Find out which step we're on by checking the first StepList
    let index = this._getSelectedIndex();
    
    if (index === -1) {
      if (typeof defaultIndex !== 'undefined') {
        index = defaultIndex;
      }
      else {
        // No step selected
        return;
      }
    }
    
    this.stepLists.getAll().forEach((stepList) => {
      this._selectItemByIndex(stepList, index);
    }, this);
  }
  
  /**
   Shows the next step. If the WizardView is already in the last step nothing will happen.
   
   @fires Coral.WizardView#coral-wizardview:change
   */
  next() {
    const stepList = this.stepLists.first();
    if (!stepList) {
      return;
    }
    
    // Change to the next step
    stepList.next();
    
    // Select the step everywhere
    this._selectStep(stepList.items.getAll().indexOf(stepList.selectedItem));
  }
  
  /**
   Shows the previous step. If the WizardView is already in the first step nothing will happen.
   
   @fires Coral.WizardView#coral-wizardview:change
   */
  previous() {
    const stepList = this.stepLists.first();
    if (!stepList) {
      return;
    }
    
    // Change to the previous step
    stepList.previous();
    
    // Select the step everywhere
    this._selectStep(stepList.items.getAll().indexOf(stepList.selectedItem));
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    this.classList.add(CLASSNAME);
  
    this._syncStepListSelection(0);
    this._syncPanelStackSelection(0);
  }
  
  /**
   Triggered when the selected step list item has changed.
   
   @event Coral.WizardView#coral-wizardview:change
   
   @param {Object} event
   Event object.
   @param {HTMLElement} event.detail.selection
   The new selected step list item.
   @param {HTMLElement} event.detail.oldSelection
   The prior selected step list item.
   */
}

export default WizardView;