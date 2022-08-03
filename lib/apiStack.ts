import {
	CfnOutput,
	Duration,
	Expiration,
	RemovalPolicy,
	Stack,
	StackProps,
} from 'aws-cdk-lib'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import * as path from 'path'
import {
	GraphqlApi,
	Schema,
	AuthorizationType,
	FieldLogLevel,
	MappingTemplate,
	PrimaryKey,
	Values,
} from '@aws-cdk/aws-appsync-alpha'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { IRole } from 'aws-cdk-lib/aws-iam'

interface APIStackProps extends StackProps {
	userpool: UserPool
	sampleTable: Table
	unauthenticatedRole: IRole
}

export class APIStack extends Stack {
	constructor(scope: Construct, id: string, props: APIStackProps) {
		super(scope, id, props)

		const api = new GraphqlApi(this, 'SampleTodoProject', {
			name: 'SampleTodoProject',
			schema: Schema.fromAsset(path.join(__dirname, 'schema.graphql')),
			authorizationConfig: {
				defaultAuthorization: {
					authorizationType: AuthorizationType.USER_POOL,
					userPoolConfig: {
						userPool: props.userpool,
					},
				},
				additionalAuthorizationModes: [
					{
						authorizationType: AuthorizationType.API_KEY,
						apiKeyConfig: {
							description: 'A sample API key',
							expires: Expiration.after(Duration.days(30)),
						},
					},
					{ authorizationType: AuthorizationType.IAM },
				],
			},
			logConfig: {
				fieldLogLevel: FieldLogLevel.ALL,
			},
			xrayEnabled: true,
		})

		api
			.addDynamoDbDataSource('SampleTodoDataSource', props.sampleTable)
			.createResolver({
				typeName: 'Query',
				fieldName: 'getSampleTodo',
				requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
				responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
			})

		api
			.addDynamoDbDataSource('SampleTodoDataSourceAPIKey', props.sampleTable)
			.createResolver({
				typeName: 'Query',
				fieldName: 'getSampleTodoPublic',
				requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
				responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
			})

		api
			.addDynamoDbDataSource('SampleTodoDataSourceIAM', props.sampleTable)
			.createResolver({
				typeName: 'Query',
				fieldName: 'getSampleTodoIAM',
				requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
				responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
			})

		api
			.addDynamoDbDataSource('SampleTodoDataSource', props.sampleTable)
			.createResolver({
				typeName: 'Mutation',
				fieldName: 'createSampleTodo',
				requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
					PrimaryKey.partition('id').auto(),
					Values.projecting('input')
				),
				responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
			})

		api.grantQuery(props.unauthenticatedRole, 'getSampleTodoIAM')

		new CfnOutput(this, 'GraphQLAPIURL', {
			value: api.graphqlUrl,
		})
		new CfnOutput(this, 'GraphQLAPIKey', {
			value: api.apiKey as string,
		})

		new CfnOutput(this, 'GraphQLAPIID', {
			value: api.apiId,
		})
	}
}
