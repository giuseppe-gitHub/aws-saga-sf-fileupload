import * as cdk from '@aws-cdk/core';
import { FileUploadStateMachine } from './file-upload-state-machine';

export class SagaSfFileuploadStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new FileUploadStateMachine(this, 'FileUploadStateMachine');
  }
}
