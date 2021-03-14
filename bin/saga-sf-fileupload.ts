#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SagaSfFileuploadStack } from '../lib/saga-sf-fileupload-stack';

const app = new cdk.App();
new SagaSfFileuploadStack(app, 'SagaSfFileuploadStack');
