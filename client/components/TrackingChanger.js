import React,{Component} from 'react';

import { selectorProcessor, hasParent } from '../lib/display-helpers.js';
import Select from 'react-select';
import SelectorPicker from './SelectorPicker';
import CurrentlyTrackedItem from './CurrentlyTrackedItem';

import { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } from 'constants';

/* The component where we will be able to track new elements or new events */

export default class TrackingChanger extends Component {
  constructor(props) {
    super();
    this.state = {
      chosenEvent: '',
      eventOptions: [
        // expand this array as event groups expand
        // https://developer.mozilla.org/en-US/docs/Web/Events
        {
          eventGroup: 'mouse',
          events: [
            'click',
            'mouseenter',
            'mouseleave',
            'mousedown',
            'mouseup',
            'dblclick',
            'mouseover',
            'mouseout',
            'contextmenu'
          ]
        },
        {
          eventGroup: 'input',
          events: [
            'change',
            'input',
            'cut',
            'copy',
            'paste'
          ]

        },
        {
          eventGroup: 'keyboard',
          events: [
            'keydown',
            'keyup',
            'keypress',
            'input',
          ]
        },
        {
          eventGroup: 'media',
          events: [
            'playing',
            'waiting',
            'seeking',
            'seeked',
            'ended',
            'loadedmetadata',
            'loadeddata',
            'canplay',
            'canplaythrough',
            'durationchange',
            'timeupdate',
            'play',
            'pause',
            'ratechange',
            'volumechange',
            'suspend',
            'emptied',
            'stalled',
          ]
        },
        {
          eventGroup: 'progress',
          events: [
            'loadstart',
            'progress',
            'error',
            'abort',
            'load',
            'loadend'
          ]
        }
        // etc...
      ],
    }
  }

  body = document.getElementsByTagName('body')[0];

  componentDidMount(){
    const that = this;
    that.state.eventOptions.map(function(el){
      const scope = that;
      el.events.map(function(event){
        scope.body.addEventListener(event, that.delegator);
      });
    });
  }

  /**
   * @name delegator
   * 
   * @argument {String} selector - the selector in question
   * @argument {String} attrString - the attribute string to add to the body tag.
   * @argument {Funcion} countEvent - the countEvent function
   * @argument {String} [remove] - If this is a delegation removal, what do you want to remove?
   * 
   * @description function to be called when delegated events are fired.
   */

  delegator(e){
    if(hasParent(e.target, document.getElementById('eventful-root'))) return;
    const body = document.getElementsByTagName('body')[0];

    let eventfulAtts = [];

    for (var i = 0, atts = body.attributes, n = atts.length; i < n; i++) {
      if(atts[i].name.indexOf('eventful-tracking') !== -1) eventfulAtts.push(atts[i].name);
    }
  
    if(eventfulAtts.length === 0) return;

    // construct selectors from the attribute string

    eventfulAtts = eventfulAtts.map(el => {
      el = el.split('-');
      const selectorInfo = {};
      selectorInfo.event = el[2];
      if (el.indexOf('class') !== -1){
        let selector = el.slice(el.indexOf('class') + 1);
        selectorInfo.value = selector.join('-');
        selectorInfo.type = 'class';
      } else if (el.indexOf('id') !== -1){
        let selector = el.slice(el.indexOf('id') + 1);
        selectorInfo.value = selector.join('-');
        selectorInfo.type = 'id';
      } else {
        selectorInfo.value = selector[selector.length - 1];
        selectorInfo.type = 'id';
      }
      return selectorInfo;
    });

    // run event tracking when e.target.classList.has(selector)/e.target.tagName.toLowerCase() === selector / e.target.id === selector
    eventfulAtts.map(
      el => {
        if(el.event === e.type){
          if(el.type === 'id') {
            if (e.target.id === el.value) console.log(e);
          } else if(el.type === 'class'){
            if (e.target.classList.has(el.value)) console.log(e);
          } else{
            if(e.target.tagName.toLowerCase() === el.value) console.log(e);
          }
        }
      }
    );
  }

  /**
   * @name delegateEvent
   * 
   * @param {String} eventType - Event type to be delegated
   * @param {String} newSelector - new selector to add to th list of targeted selectors.
   * 
   * @description - The actual function that sets up an event to be tracked.
   * Uses event delegation in order to make sure that future elements of the same selector get tracked as well.
   * 
   */
  delegateEvent(eventType, newSelector) {
    const evt = eventType || 'click';
    var attrString = 'eventful-tracking-' + evt + selectorProcessor(newSelector);
    if(this.body.hasAttribute(attrString)) return;

    const that = this;
    this.body.addEventListener(evt, (that.delegator)(that, newSelector, attrString, that.countEvent.bind(that)),true);
  }

  /**
   * @name removeTracking
   * 
   * @param {Element} removalLink - The actual link clicked
   * @param {String} eventName - name of event associated with tracker to remove
   * @param {String} selector - selector associated with tracker to remove
   * 
   * @description - Intended to allow for quick removal of tracking.
   * removes previously delegated events.
   */
  removeTracking(eventType, selector) {
    if(!!!eventType){
        throw new ReferenceError('removeEvent was called without an event type set to be removed');
    }
    if(!!!selector){
        throw new ReferenceError('removeEvent was called without a selector to remove an event from');
    }
    
    // Dump the tracker if it matches both selector and event
    const newSelectedSelectors = this.props.selectedSelectors.filter( el => el.selector !== selector || el.event !== eventType );

    var selectorAttribute = 'eventful-tracking-' + eventType;
    selectorAttribute += selectorProcessor(selector);

    this.body.removeAttribute(selectorAttribute);

    this.props.changeSelectedSelectors(newSelectedSelectors);
    
    return newSelectedSelectors;
  }

  /**
   * @name countEvent
   * 
   * @param {Event} event 
   * 
   * @description - The function that creates event information
   * and sends it back up the component tree using props.updateCounter.
   * 
   * This could be a much more robust logging function.
   * 
   */
  countEvent(event, selector) {
    const that = this;
    let description = 'Last tracked event: '+ event.type + ' on ' + selector + '.';// This is not needed. Maybe a more robust identifier? element.outerHTML?
    that.props.updateCounter(description, event, event.target, that.sel);
    return true;
  };

  /**
   * @name onSelectSelector
   * 
   * @param {String} toAdd - selector to be tracked
   * @param {String} evt - name of event to be tracked 
   * 
   * update the list of selected selectors with an object
   * containing the most recently selected selector matched with the event selected.
   * 
   */
  onSelectSelector(toAdd, evt) {
    let currentlySelected = this.props.selectedSelectors;
    
    if(currentlySelected.indexOf(toAdd) === -1){

      const now = new Date().toDateString();

      currentlySelected[currentlySelected.length] = {
        selector: toAdd,
        event: evt,
        count: 0,
        started: now
      };
    
      this.setState({
        selectedSelectors: currentlySelected,
        chosenEvent: ''
      });
  
      var attrString = 'eventful-tracking-' + evt + selectorProcessor(toAdd);
      this.body.setAttribute(attrString, true);
    }

  }

  handleChange (selectedOption){
    this.setState({

			chosenEvent: selectedOption.value,
    
    });
  }

  renderEventPicker() {//Currently Tracking section should be abstracted into a component for use everywhere.
    let currentlyTracking = this.props.selectedSelectors.length > 0 ? (
      <section className={ 'currently-tracking' }>
        <h3>Currently Tracking</h3>
        <ul>
          { this.props.selectedSelectors.map((e, i)=>( <CurrentlyTrackedItem key={ i } e={ e } event={ event } removeTracking={ this.removeTracking.bind(this) } /> )) }
        </ul>
      </section>
    ) : '';

    if (this.state.chosenEvent === ''){
      // Add ability to focus on specific event categories depending upon element chosen.
      // Need to make element selection first.
      // Issue #13 - https://github.com/juddfranklin1/eventful-widget/issues/13
      const eventOptions = this.state.eventOptions[0].events.map((e,i) =>( { value: e, label: e } ));
      return (
        <div className='choose-event add-tracking-wrapper'>
          { currentlyTracking }
        
          <label htmlFor="chooseEvent">
            <h4>Pick an event to track.</h4>
          
            <Select
              name = 'chooseEvent'
              value = { this.state.selectValue }
              onChange = { this.handleChange.bind(this) }
              options = { eventOptions }
              id = "chooseEvent"
              clearable = { false }
              aria-describedby = { 'Choose an event to track' }
              aria-label = "Choose event"
              autoFocus = { true }

            />
          </label>
        </div>
      );

    } else {
      return (
        <div className='choose-class add-tracking-wrapper'>
          { currentlyTracking }
          
          <SelectorPicker
            selectedSelectors={ this.props.selectedSelectors }
            pageSelectors={ this.props.pageSelectors }
            eventName={ this.state.chosenEvent }
            selectSelector={ (sel, evt) => this.onSelectSelector(sel, this.state.chosenEvent) }
          />
        </div>
      );

    }
  }

  render() {
    return (
      <div className='add-wrapper section'>
        
        <h2>Add Tracking</h2>

        { this.renderEventPicker() }

      </div>
    );
  };
}