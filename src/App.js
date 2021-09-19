import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2';
import OpenAI from 'openai-api';
import clearIcon from './icons/clear.svg';
import completeIcon from './icons/complete.svg';
import fixIcon from './icons/fix.svg';
import runIcon from './icons/run.svg';
import loadingIcon from './icons/loading.gif';

require('codemirror/lib/codemirror.css');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/python/python');
const verbCheck = require('verb-check');
const prettier = require("prettier");
var pythonFormat = require('python-format');



function App() {

  const [messages, setMessages] = useState([{
    'message': "Hello! I'm your python mentor. Start commands with 'Write' if you want me to write the program for you. You can also ask me direct questions about programming!",
    'direction': 'from'
  }]);

  const [tempCode, setTempCode] = useState('');
  const [consoleText, setConsole] = useState('');
  const [outputText, setOutput] = useState('');
  const [iconLoading, setIconLoading] = useState([]);
  const [currentInput, setCurrentInput] = useState([]);
  const [oldOutputText, setOldOutputText] = useState([]);

  function removeItem(item) {
    setIconLoading(iconLoading.filter(e => e != item))
  }

  function addIcon(item) {
    setIconLoading(iconLoading.concat([item]))
  }
 
  const OPENAI_API_KEY = 'sk-vGvqOZulHcaa8JqIKEStF5EDFbmCxHuzM7ux2fcE';

  const openai = new OpenAI(OPENAI_API_KEY);

  function isIllegalEdit(editor, data, value) {
    var lines = outputText.split('\n');

    if (data.from.line != lines.length - 1) {
      return true;
    } else if (data.from.ch + 1 > lines[lines.length - 1].length) {
      return false;
    }

    return true;
  }

  function getInput(editor, data, value) {
    var defaultLines = outputText.split('\n');
    var editedLines = value.split('\n');

    return editedLines[defaultLines.length - 1].substring(defaultLines[defaultLines.length - 1].length)
  }

  function runCode(input = []) {
    setCurrentInput(input);
    console.log(input);
    addIcon('run');
      var xhr = new XMLHttpRequest();
      xhr.open("POST", 'https://HTN21-Bridge-Mine.con266667.repl.co/run', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        code: tempCode,
        id: '12300',
        language: 'python',
        input: input
      }));
      xhr.onload = function() {
        console.log(this.responseText)
        var data = JSON.parse(this.responseText);
        console.log(data['output']);
        setConsole(data['output']);
        setOutput(data['output']);
        if (data['needs_input']) {
          var newOldOutputs = [...oldOutputText, data['output'].replace('\n', '')];
          setOldOutputText(newOldOutputs)
          var newConsole = data['output'];
          for (var i = 0; i < newOldOutputs.length - 1; i++) {
            console.log(input[i])
            newConsole = newConsole.replace( newOldOutputs[i], newOldOutputs[i] + input[i] + '\n')
            // console.log(newOldOutputs[i]);
            // console.log(newOldOutputs[i + 1])
            // newConsole += newOldOutputs[i] + input[i] + '\n' + newOldOutputs[i + 1].replace(newOldOutputs[i], '');
            setConsole(newConsole);
            setOutput(newConsole);
          }
        }
        removeItem('run');
      };
      xhr.onerror = function() {
        alert("Server Error")
        removeItem('run');
      }
  }

  return (
    <div className="App">
      <div className="row h-100">
        <div className="col h-100">
          <div className="card border-0 shadow-lg editor h-100">
          <div className='row'>
            <div className='col-10'>
            <CodeMirror
              value={tempCode}
              className='CodeEditorArea'
              options={{
                mode: 'python',
                //theme: 'material',
                lineNumbers: true
              }}
              onBeforeChange={(editor, data, value) => {
                // setTempCode(value)
                //pythonFormat(value)
                setTempCode(value);
                
              }}
              onSelection={(editor, data) => {
                // var selected = window.getSelection().toString();
                // if(selected != '') {
                //   console.log(selected);
                // }
              }}
            />
            </div>
            <div className='col'>
              <div className='row'>
              <button className='runbtn' onClick={async () => {
                runCode()
              }}>
                <img src={iconLoading.includes('run') ? loadingIcon : runIcon}></img>
            </button>
            </div>
            <div className='row'>
            <button className='runbtn' onClick={async () => {
              addIcon('complete')
                const gptResponse = await openai.complete({
                  engine: 'davinci-codex',
                  prompt: tempCode,
                  maxTokens: 64,
                  temperature: 0.9,
                  topP: 1,
                  presencePenalty: 0,
                  frequencyPenalty: 0,
                  bestOf: 1,
                  n: 1,
                  stream: false,
                  stop: ['"""']
              });
          
              setTempCode(tempCode + gptResponse.data.choices[0].text);
              removeItem('complete')
            }}>
              <img src={iconLoading.includes('complete') ? loadingIcon : completeIcon}></img>
            </button>
            </div>
            <div className='row'>
            <button className='runbtn' onClick={async () => {
              addIcon('fix')
                const gptResponse = await openai.complete({
                  engine: 'davinci-codex',
                  prompt: `##### Fix bugs in the below function

                  ### Buggy Python
                  ${tempCode}

                  ### Fixed Python
                  `
                  ,
                  maxTokens: 64,
                  temperature: 0.9,
                  topP: 1,
                  presencePenalty: 0,
                  frequencyPenalty: 0,
                  bestOf: 1,
                  n: 1,
                  stream: false,
                  stop: ['###']
              });
          
              setTempCode(gptResponse.data.choices[0].text);
              removeItem('fix')
            }}>
              <img src={iconLoading.includes('fix') ? loadingIcon : fixIcon}></img>
            </button>
            </div>
            <div className='row'>
              <button className='runbtn' onClick={() => {
                setTempCode('');
                setConsole('');
              }}>
              <img src={clearIcon}></img>
            </button>
            </div>
            </div>
          </div>
          <CodeMirror
            value={consoleText}
            className='ConsoleArea'
            options={{
              mode: 'python',
              //theme: 'material',
              lineNumbers: true,
            }}
            onBeforeChange={(editor, data, value) => {
              setConsole(value);
              if(isIllegalEdit(editor, data, value)) {
                setConsole(outputText)
              }
              if(data.text.length == 2) {
                setConsole(outputText)
                runCode([...currentInput, getInput(editor, data, value)])
              }
            }}
          />
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-lg bot">
              <div className='h-100 p-3 messages'>
                {
                  messages.map(message => <div className={message.direction + ' py-3'}>{(message.direction == 'from' ? '> ' : '') + message.message}</div>)
                }
              </div>
                <input type='textfield' className='msgin' placeholder='Type a message...' onKeyPress={async event => {
                  if(event.key === 'Enter') {
                    const input = event.target.value;
                    event.target.value = '';
                    setMessages([
                      {
                        'message': input,
                        'direction': 'to'
                      }, ...messages])

                    if(verbCheck.check(input.split(' ')[0])) {
                      console.log(`${tempCode}\n"""\n${input}\n"""`);
                      const gptResponse = await openai.complete({
                        engine: 'davinci-codex',
                        prompt: `#Python 3\n${tempCode}\n"""\n${input}\n"""`,
                        maxTokens: 120,
                        temperature: 0.9,
                        topP: 1,
                        presencePenalty: 0,
                        frequencyPenalty: 0,
                        bestOf: 1,
                        n: 1,
                        stream: false,
                        stop: ['"""', '\n\n\n']
                    });
                    setTempCode(tempCode + gptResponse.data.choices[0].text)
                    setMessages([
                      {
                        'message': 'Done.',
                        'direction': 'from'
                      },
                      {
                        'message': input,
                        'direction': 'to'
                      },
                         ...messages])
                    } 
                    else {
                    const gptResponse = await openai.complete({
                      engine: 'davinci-codex',
                      prompt: `
                      Python Chatbot

                      You: How do I sort an array?
                      Python Chatbot: Use the sort() method
                      You: How do I make a new function?
                      Python Chatbot: def function_name():
                      You: How do I print Hello, World?
                      Python Chatbot: print("Hello, World")
                      You: What's the difference between a float and an int?
                      Python Chatbot: A float can have decimals, an int can't
                      You: ${input}
                      Python Chatbot:`,
                      maxTokens: 35,
                      temperature: 0.9,
                      topP: 1,
                      presencePenalty: 0,
                      frequencyPenalty: 0,
                      bestOf: 1,
                      n: 1,
                      stream: false,
                      stop: ['You:']
                  });
              
                  setMessages([
                    {
                      'message': gptResponse.data.choices[0].text,
                      'direction': 'from'
                    },
                    {
                      'message': input,
                      'direction': 'to'
                    },
                       ...messages])
                  }
                }
                }}></input>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
