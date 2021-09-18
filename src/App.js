import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2';
import OpenAI from 'openai-api';
require('codemirror/lib/codemirror.css');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/python/python');

function App() {

  const [messages, setMessages] = useState([{
    'message': "Hello! I'm your python mentor",
    'direction': 'from'
  }]);

  const [tempCode, setTempCode] = useState('');

  const [consoleText, setConsole] = useState('');

  const OPENAI_API_KEY = 'openai';

  const openai = new OpenAI(OPENAI_API_KEY);

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
              <button className='runbtn' onClick={async () => {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", 'https://HTN21-Bridge.itspedram.repl.co/run', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify({
                    code: tempCode,
                }));
                xhr.onload = function() {
                    var data = this.responseText;
                    console.log(this);
                    setConsole(data);
                };
              }}>
              RUN
            </button>
            <button className='runbtn' onClick={async () => {
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
            }}>
              COMPLETE
            </button>
            <button className='runbtn' onClick={async () => {
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
            }}>
              FIX
            </button>
            <div className='col'>
              <button className='runbtn' onClick={() => {
                setTempCode('');
                setConsole('');
              }}>
              CLEAR
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
              readOnly: true
            }}
            onChange={(editor, data, value) => {

            }}
          />
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-lg bot">
              <div className='h-100 p-3 messages'>
                {
                  messages.map(message => <div className={message.direction + ' py-3'}>{message.message}</div>)
                }
              </div>
                <input type='textfield' className='msgin' onKeyPress={async event => {
                  if(event.key === 'Enter') {
                    const input = event.target.value;
                    event.target.value = '';
                    setMessages([
                      {
                        'message': input,
                        'direction': 'to'
                      }, ...messages])
                    
                    if(input.toLowerCase().startsWith("write")) {
                      const gptResponse = await openai.complete({
                        engine: 'davinci-codex',
                        prompt: `"""\n${input}\n"""`,
                        maxTokens: 100,
                        temperature: 0.9,
                        topP: 1,
                        presencePenalty: 0,
                        frequencyPenalty: 0,
                        bestOf: 1,
                        n: 1,
                        stream: false,
                        stop: ['"""']
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
