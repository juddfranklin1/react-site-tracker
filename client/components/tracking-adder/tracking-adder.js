import React,{Component} from 'react';
import ReactDOM from 'react-dom';


import Select from 'react-select';
import SelectorPicker from '../selector-picker/selector-picker.js';

/* The component where we will be able to track new elements or new events */

export default class TrackingAdder extends Component {
  constructor(props) {
    super();
    this.state = {
      chosenEvent: '',
      eventOptions: [
        'click',
        'mouseenter',
        'mouseleave',
        'mousedown',
        'mouseup',
        'keydown',
        'focus',
        'blur'
      ],  
    }
  }
  
  /* Let's abstract this function
   * to delegate different event types.
   * Once there's an API, this should POST event details to the DB.
   * */  
  delegateEvent(eventType,newClass) {
    const evt = eventType || 'click';
    const that = this;
    const targetClasses = Array.of(newClass) || this.state.selectedClasses;

    targetClasses.map(function(targetClass) 
    {
      document.getElementsByTagName('body')[0].addEventListener(evt, function(e) {
        let failsFilter = true,
          el = e.target;
        while (el !== this && (failsFilter = el.className.indexOf(targetClass) === -1) && (el = el.parentNode));
        if (!failsFilter) {
          if(!el.hasAttribute('eventful-tracked-' + evt)){//protect against duplicate event listener
            el.addEventListener(evt, that.countEm.bind(that), { capture: false, once: false, passive: true });
            el.setAttribute('eventful-tracked-' + evt,'true');
          }
        }
      },true);
    });
  }

  /* Let's abstract this function
   * to count different event types.
   * Once there's an API, this should POST event details to the DB.
   * */
  countEm(event) {
    let element = event.target;
    let description = 'Last tracked event: '+ event.type + ' on ' + element.tagName.toLowerCase();
    if (typeof(element.innerHTML) === 'string') {
      description += '.' + element.className + '.';
    }
    this.props.updateCounter(description, event, element);
    return true;
  };

  onSelectClass(toAdd,evt) {
    let currentlySelected = this.props.selectedClasses;
    
    if(currentlySelected.indexOf(toAdd) === -1){
    
      currentlySelected[currentlySelected.length] = toAdd;
    
      this.setState({
    
        selectedClasses: currentlySelected
    
      });
  
      (this.delegateEvent.bind(this, evt, toAdd))(this);

    }

  }

  handleChange (selectedOption){
    this.setState({

			chosenEvent: selectedOption.value,
    
    });
  }

  renderEventPicker() {
    if (this.state.chosenEvent === ''){
      const eventOptions = this.state.eventOptions.map((e,i) =>( { value: e, label: e } ));

      return (
        <div className='choose-event add-tracking-wrapper'>
          <h3>Pick an event to track.</h3>
          <Select
            name='chooseEvent'
            value={ this.state.selectValue }
            onChange={ this.handleChange.bind(this) }
            options={ eventOptions }
            id="chooseEvent"
          />
        </div>
      );
    } else {
      return (
        <div className='choose-class add-tracking-wrapper'>
              <h3>Pick some classes to track events on.</h3>
  
              <SelectorPicker
                selectedClasses={ this.props.selectedClasses }
                pageClasses={ this.props.pageClasses }
                eventName={ this.state.chosenEvent }
                selectClass={ (sel, evt) => this.onSelectClass(sel, this.state.chosenEvent) } />
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