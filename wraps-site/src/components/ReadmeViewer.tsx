import React from 'react';
import { NoSsr, Typography, Box} from '@material-ui/core';
import ReactMarkdown from 'react-markdown';

enum FetchState {
    Running,
    Finished,
    Error,
}

export class ReadmeViewer extends React.Component<
    { url: string },
    { status: FetchState; error: any | null; result: string | null }
    > {
    state: { status: FetchState; error: any | null; result: string | null } = {
        status: FetchState.Running,
        error: null,
        result: null,
    };

      cancel:AbortController=new AbortController();

      async fetchHelper(){
        let response=await fetch(this.props.url,{signal:this.cancel.signal});
        if(response.ok){
          let content=await response.text()
          this.setState({status:FetchState.Finished,result:content});
        }else{
          throw new Error(JSON.stringify({status:response.status,statusText:response.statusText}));
        }
      }

      componentDidMount() {
        this.fetchHelper().catch((e)=>{
          this.setState({status:FetchState.Error,error:e});
          console.error(e);
        }).catch(console.error);
    }

      componentWillUnmount(){
        this.cancel.abort();
      }

      render(){
        if(this.state.status===FetchState.Running){
          return <Typography>Loading...</Typography>
        }else if(this.state.status===FetchState.Finished){
          if(this.state.result!==null){
            return <Box padding="30px">
              <ReactMarkdown source={this.state.result}/>
            </Box>
          }throw new Error("this should never happen");
        }else{
          return <Typography>
            Some Error occouired!
          </Typography>;
        }
      }
}

export default function ReadmeViewerNoSsr(props:{ url: string }) {
    return <NoSsr defer={true}>
        <ReadmeViewer url={props.url} />
    </NoSsr>;
}
