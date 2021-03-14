import { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import * as aws from 'aws-sdk';
import { IStepFunctionInput } from '../models/dto-models';
import {v4 as uuid4} from 'uuid';
import { StartExecutionInput, StartExecutionOutput } from 'aws-sdk/clients/stepfunctions';

const stepFunctions = new aws.StepFunctions();

const handler: Handler<APIGatewayProxyEvent> = (event: APIGatewayProxyEvent, context, callback) => {
    
    let runType = "success";
    
    if(null != event.queryStringParameters){
        if(typeof event.queryStringParameters.runType != 'undefined') {
            runType = event.queryStringParameters.runType;
        }
    }

    const body = JSON.parse(event.body!) as Omit<IStepFunctionInput, 'fileKey'>;
    const fileKey = uuid4();

    let input: IStepFunctionInput = {
        ...body,
        fileKey
    };
    
    const params: StartExecutionInput = {
        stateMachineArn: process.env.statemachine_arn!,
        input: JSON.stringify(input)
    };
    stepFunctions.startExecution(params, (err: aws.AWSError, data: StartExecutionOutput) => {
        if (err) {
        
            console.log(err);
            const response = {
                statusCode: 500,
                body: err
            };
            callback(null, response);
        } else {
            
            console.log(data);
            const response = {
                statusCode: 200,
                body: data
            };
            callback(null, response);
        }
    });
};

exports.handler = handler;