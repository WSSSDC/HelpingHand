import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2';
import OpenAI from 'openai-api';
import clearIcon from './icons/clear.svg';
import completeIcon from './icons/complete.svg';
import fixIcon from './icons/fix.svg';
import runIcon from './icons/run.svg';
import chatIcon from './icons/chat.svg';
import folderIcon from './icons/folder.svg';
import loadingIcon from './icons/loading.gif';
import { inputStyles } from 'codemirror';

require('codemirror/lib/codemirror.css');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/python/python');
const verbCheck = require('verb-check');
const prettier = require("prettier");
var pythonFormat = require('python-format');



function App() {

  const [messages, setMessages] = useState([{
    'message': "Hello, I'm your python mentor.",
    'direction': 'from'
  }]);

  const [consoleText, setConsole] = useState('');
  const [outputText, setOutput] = useState('');
  const [iconLoading, setIconLoading] = useState([]);
  const [currentInput, setCurrentInput] = useState([]);
  const [oldOutputText, setOldOutputText] = useState([]);
  const [needsInput, setNeedsInput] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setFile] = useState('x');
  const [fileContent, setFileContent] = useState({
    'x': {
      'content': ''
    }
  });
  const [selectedPanelTab, setPanelTab] = useState('chat');

  useEffect(() => {
    getFiles()
  }, []);

  function removeItem(item) {
    setIconLoading(iconLoading.filter(e => e != item))
  }

  function addIcon(item) {
    setIconLoading(iconLoading.concat([item]))
  }

  function getFiles() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://HTN21-Bridge-Mine.con266667.repl.co/files/getlist', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      id: '69420',
    }));
    xhr.onload = function() {
      var filesReceived = JSON.parse(this.responseText)['output'].map(e => e.replace('tmp/69420/', ''));
      setFiles(filesReceived);
      setFile(filesReceived[0]);
      getFileContent(filesReceived[0]);
    }
  }

  function getFileContent(filename=selectedFile, open=null, override=false) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://HTN21-Bridge-Mine.con266667.repl.co/files/getcontent', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      id: '69420',
      path: filename
    }));
    xhr.onload = function() {
      if(!(filename in fileContent) || override) {
        updateFile(filename, JSON.parse(this.responseText)['output'], open);
      }
    }
  }

  function updateFile(filename, content, open=null) {
    var _open = open;
    if (_open == null) {
      try {
        _open = fileContent[filename]['open']
      } catch {
        _open = true;
      }
    }
    var updatedContent = Object.assign({}, fileContent);
    console.log(_open)
    updatedContent[filename] = {
      'content': content,
      'open': _open
    };
    
    setFileContent(updatedContent);

    if (filename == selectedFile && _open == false) {
      var newTab = Object.keys(fileContent).filter(e => e != filename && fileContent[e]['open'])[0];
      console.log(newTab);
      setFile(newTab);
      getFileContent(newTab);
    }

    writeToFile(filename, content);
  }

  function openFile(filename) {
    getFileContent(filename, true, true);
    setFile(filename);
  }

  function writeToFile(filename=selectedFile, content=fileContent[selectedFile]) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://HTN21-Bridge-Mine.con266667.repl.co/files/write', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      id: '69420',
      path: filename,
      content: content
    }));
  }
 
  const OPENAI_API_KEY = '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';

  const openai = new OpenAI(OPENAI_API_KEY);

  function isIllegalEdit(editor, data, value) {
    var lines = outputText.split('\n');

    if(!needsInput) {
      return true;
    }

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
    // if (input == []) {
    //   setNeedsInput(false);
    //   setOldOutputText([]);
    //   setConsole('');
    //   setOutput('');
    // }
    setCurrentInput(input);
    addIcon('run');
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://HTN21-Bridge-Mine.con266667.repl.co/run', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      code: fileContent[selectedFile]['content'],
      id: '12300',
      language: 'python',
      input: input
    }));
    xhr.onload = function() {
      var data = JSON.parse(this.responseText);
      setConsole(data['output']);
      setOutput(data['output']);
      if (data['needs_input']) {
        setNeedsInput(true);
      }
      if (data['needs_input'] || input.length > 0) {
        var newOldOutputs = [...oldOutputText, data['output'].substring(0, data['output'].length - 1)];
        setOldOutputText(newOldOutputs)
        var newConsole = data['output'];
        console.log(newOldOutputs);
        console.log([newConsole])
        var startAt = 0;
        for (var i = 0; i < newOldOutputs.length - 1; i++) {
          newConsole = newConsole.replace(newOldOutputs[i].substring(startAt), newOldOutputs[i].substring(startAt) + input[i] + '\n')
          startAt += newOldOutputs[i].length;
        }
        if(input.length > 0) {
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

  function createFile(filename) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://HTN21-Bridge-Mine.con266667.repl.co/files/createfile', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      id: '69420',
      path: filename
    }));

    setFiles([...files, filename]);
    var updatedContent = Object.assign({}, fileContent);
    updatedContent[filename] = {
      'content': '',
      'open': true
    };
    setFileContent(updatedContent);
    setFile(filename);
  }

  function deleteFile(filename) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://HTN21-Bridge-Mine.con266667.repl.co/files/deletefile', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      id: '69420',
      path: filename
    }));

    var newFiles = [...files];
    newFiles = newFiles.filter(e => e != filename);

    setFiles(newFiles);
    var updatedContent = Object.assign({}, fileContent);
    updatedContent[filename] = {};
    setFileContent(updatedContent);
  }

  return (
    <div className="App">
      <div className="row h-100">
        <div className="col h-100">
          <div className="card border-0 shadow-lg editor h-100">
          <div className='row tabs px-5 pt-2'>
          {files.filter(e => {
            try {
              return fileContent[e]['open']
            } catch {
              return true;
            }
          }).map(e => 
            <div className={'col mb-0 card border-0 shadow-lg tab'}>
              <button style={{border: 'none', backgroundColor: 'transparent'}} onClick={() => {
                setFile(e);
                getFileContent(e);
              }}>
                <div className={(selectedFile == e ? '' : 'tab-disabled')}>{e} 
                  <button type="button" className='closeBtn' style={{border: 'none', backgroundColor: 'transparent', float: 'right', color:'grey'}} onClick={() => {
                    var content;
                    try {
                      content = fileContent[e]['content'];
                    } catch {
                      content = ''
                    }
                    updateFile(e, content, false)
                  }}>×</button>
                </div>
              </button>
             </div>
          )}
          </div>
          <div className='row'>
            <div className='col-12'>
            <CodeMirror
              value={selectedFile in fileContent && 'content' in fileContent[selectedFile] ? fileContent[selectedFile]['content'] : ''}
              className='CodeEditorArea'
              options={{
                mode: 'python',
                //theme: 'material',
                lineNumbers: true
              }}
              onBeforeChange={(editor, data, value) => {
                // setTempCode(value)
                // try {
                  
                //   setTempCode(pythonFormat(value));
                // } catch {
                //   setTempCode(value);
                // }
                updateFile(selectedFile, pythonFormat(value))
              }}
            />
            </div>
            <div className='col icons'>
              <div className='row'>
              <button className='runbtn' onClick={async () => {
                setCurrentInput([]);
                setOldOutputText([])
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
                  prompt: fileContent[selectedFile]['content'],
                  maxTokens: 128,
                  temperature: 0.9,
                  topP: 1,
                  presencePenalty: 0,
                  frequencyPenalty: 0,
                  bestOf: 1,
                  n: 1,
                  stream: false,
                  stop: ['"""']
              });
          
              updateFile(selectedFile, fileContent[selectedFile]['content'] + gptResponse.data.choices[0].text)
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
                  ${fileContent[selectedFile]['content']}

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
          
              updateFile(selectedFile, gptResponse.data.choices[0].text);
              removeItem('fix')
            }}>
              <img src={iconLoading.includes('fix') ? loadingIcon : fixIcon}></img>
            </button>
            </div>
            <div className='row'>
              <button className='runbtn' onClick={() => {
                updateFile(selectedFile, '')
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
            <div className='picker-pill shadow-lg row'>
              <div className='col-6'>
                <button onClick={() => setPanelTab('chat')}>
                <img src={chatIcon} className={'picker-item' + (selectedPanelTab == 'chat' ? ' picker-item-selected' : '')}></img>
                </button>
              </div>
              <div className='col-6'>
                <button onClick={() => setPanelTab('folder')}>
                <img src={folderIcon} className={'picker-item' + (selectedPanelTab == 'folder' ? ' picker-item-selected' : '')}></img>
                </button>
              </div>
            </div>
            {selectedPanelTab == 'chat' ? 
            <div style={{width: '100%', height: '78%'}}>
              <div className='h-100 p-3 messages'>
                {
                  messages.map(message => <div className={message.direction + ' py-3'}>{message.message}</div>)
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
                      console.log(`${fileContent[selectedFile]['content']}\n"""\n${input}\n"""`);
                      const gptResponse = await openai.complete({
                        engine: 'davinci-codex',
                        prompt: `#Python 3.7\n${fileContent[selectedFile]['content']}\n"""\n${input}\n"""`,
                        maxTokens: 120,
                        temperature: 0.9,
                        topP: 1,
                        presencePenalty: 0,
                        frequencyPenalty: 0,
                        bestOf: 1,
                        n: 1,
                        stream: false,
                        stop: ['\n\n\n']
                    });
                    updateFile(selectedFile, fileContent[selectedFile]['content'] + gptResponse.data.choices[0].text)
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
                </div> :
                <div className='sidebar pt-3 px-3'>
                  <a className="d-flex align-items-center pb-3 mb-3 link-dark text-decoration-none border-bottom">
                    <span className="fs-5 fw-semibold">Files</span>
                  </a>
                  <ul className="list-unstyled ps-0">
                    <li className="mb-3">
                      <button className="btn btn-toggle align-items-center rounded" data-bs-toggle="collapse" data-bs-target="#home-collapse" aria-expanded="true">
                        My Files
                      </button>
                      <div className="collapse show" id="home-collapse">
                        <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                          {files.filter(file => !file.includes('/')).map(file => 
                            <li>
                              <a  className="link-dark rounded" onClick={() => openFile(file)}>{file}</a>
                              <button type="button" className='closeBtn' style={{border: 'none', backgroundColor: 'transparent', float: 'right', color:'grey'}} onClick={() => {
                                  deleteFile(file)
                              }}>×</button>
                            </li>
                          )}
                        </ul>
                      </div>
                    </li>
                    <li><input type='text' className='msgin' placeholder="Add a file..." onKeyPress={(event) => {
                      if(event.key === 'Enter') {
                        createFile(event.target.value);
                        event.target.value = '';
                      }
                    }}></input></li>
                  </ul>
                </div>
              }
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
