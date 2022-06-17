import React, { useState, useEffect, useRef } from 'react';
import { Container, Divider, Header, Image, Icon, Message, List, Button, Loader } from 'semantic-ui-react';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import CLEAR from './clear.js';
import 'semantic-ui-css/semantic.min.css';
import './main.css';


const App = () => {
    const inputRef = useRef(null);
    const [modelPromise, setModelPromise] = useState();
    const [source, setSource] = useState();
    const [stopFlag, setStopFlag] = useState();
    const [endFlag, setEndFlag] = useState(false);
    const [imgs, setImgs] = useState([]);

    useEffect(() => {
        const load = async () => {
            tf.setBackend("webgl");
            setModelPromise(mobilenet.load({version: 2, alpha: 1.0}));
        };
        load();
    }, []);

    const onFileInputChange = async (e) => {
        const source = e.target.files[0];
        const source_url = URL.createObjectURL(source);
        const flag = [false];
        setStopFlag(flag);
        setSource(source_url);
        await CLEAR(source, modelPromise, setImgs, flag);
        setEndFlag(true);
    }

    const imagelist = [];
    for (let i of imgs) {
        imagelist.push(
            <a href={i[2]} key={i[1]} target='_blank' rel='noreferrer'>
                <Image width="240px" src={i[1]} wrapped className='resimg'/>
            </a>
        )
    }

    const input_or_source = source ? <Image centered src={source} width='500'/> : <Button primary onClick={() => {inputRef.current.click()}}>Press to Select File</Button>

    return (
        <Container>
            <Divider hidden/>
            <Header as='h1' dividing>
                <Header.Content><a href="/" style={{color: 'black'}}><Icon name='gem outline'/>CLEAR</a></Header.Content>
                <Header.Subheader>A fully user-side image search engine.</Header.Subheader>
            </Header>
            <input hidden type='file' accept='image/*' onChange={onFileInputChange} ref={inputRef}/>
            <div className='inspace'>
                {input_or_source}
            </div>
            <Divider hidden/>
            {
                source && !endFlag && <div className='loading'>
                    <Button negative onClick={() => {stopFlag[0] = true; setEndFlag(true);}}>Cancel</Button>
                    <Divider hidden/>
                    <Loader active inline='centered'/>
                    <Divider hidden/>
                </div>
            }
            {
                endFlag && <Message positive size='big' className='end'>
                    <p>Done!</p>
                    <p>Reload to Try Again.</p>
                </Message>
            }
            {imagelist}
            <Message size='big'>
                <Message.Content>
                <Message.Header><Icon name='pencil'/>Highlights</Message.Header>
                <List bulleted>
                    <List.Item>
                        Flickr does not provide an official similar image search engine nor corresponding API. Nevertheless, CLEAR realizes it on a user-side.
                    </List.Item>
                    <List.Item>
                        CLEAR runs totally on a client side. It does not use a backend server at all.
                    </List.Item>
                    <List.Item>
                        CLEAR does not store any images nor build search indices, while traditional search systems require to build search indices.
                    </List.Item>
                </List>
                </Message.Content>
                <Divider hidden/>
                <Message.Content>
                <Message.Header><Icon name='lightbulb outline'/>Tips</Message.Header>
                <List bulleted>
                    <List.Item>
                        CLEAR is good at images with an explicit object class, e.g., dog, cat, and bird, due to the backbone image feature  extractor.
                    </List.Item>
                    <List.Item>
                        CLEAR is NOT good at portrait images due to the backbone image feature  extractor.
                    </List.Item>
                </List>
                Source code is available at <a href='https://github.com/joisino/clear' target='_blank' rel='noreferrer'>https://github.com/joisino/clear</a>. <br/>
                You can fork the repository and customize and run you own CLEAR.
                </Message.Content>
            </Message>
            <div style={{textAlign: "right"}}>Author's webpage: <a href='https://joisino.net/en' target='_blank' rel='noreferrer'>https://joisino.net/en</a></div>
        </Container>
        
    );
}

export default App;
