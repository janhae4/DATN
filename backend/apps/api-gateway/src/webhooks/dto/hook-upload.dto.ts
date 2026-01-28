export interface S3Object {
    key: string;         
    size: number;       
    eTag: string;    
    contentType: string;
    sequencer: string;
}

export interface S3Bucket {
    name: string;        
    ownerIdentity: {
        principalId: string;
    };
    arn: string;
}

export interface S3Data {
    s3SchemaVersion: string;
    configurationId: string;
    bucket: S3Bucket;
    object: S3Object;   
}

export interface MinioRecord {
    eventVersion: string;
    eventSource: string; 
    awsRegion: string;
    eventTime: string;   
    eventName: string;
    userIdentity: {
        principalId: string;
    };
    requestParameters: {
        accessKey?: string;
        region?: string;
        sourceIPAddress: string;
    };
    responseElements: {
        [key: string]: string; 
    };
    s3: S3Data;  
}      

export interface MinioWebhookEvent {
    EventName?: string;   
    Key?: string;
    Records: MinioRecord[]; 
}