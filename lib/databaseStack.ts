import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

interface DatabaseStackProps extends StackProps {}

export class DatabaseStack extends Stack {
	public readonly sampleTable: Table
	constructor(scope: Construct, id: string, props: DatabaseStackProps) {
		super(scope, id, props)

		const sampleTable = new Table(this, 'SampleDB', {
			removalPolicy: RemovalPolicy.DESTROY,
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: 'id', type: AttributeType.STRING },
		})

		this.sampleTable = sampleTable
	}
}
