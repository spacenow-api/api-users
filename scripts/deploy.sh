#!/usr/bin/env bash

function get_ssm_parameter() {
    SSM_VALUE=`aws ssm get-parameters --with-decryption --names "${1}"  --query 'Parameters[*].Value' --output text`
    echo "${SSM_VALUE}"

}

usage="Usage: $(basename "$0") region environment
where:
  region       - the AWS region
  stack-name   - AWS Environment (dev,test,prod)
  image-url
  slice-name   - git branch

"

if [ "$1" == "-h" ] || [ "$1" == "--help" ] || [ "$1" == "help" ] || [ "$1" == "usage" ] ; then
  echo "$usage"
  exit -1
fi

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ] ; then
  echo "$usage"
  exit -1
fi
set -eo pipefail
# region=ap-southeast-2
region=$1
stack_name=$(echo "$2-SPACENOW-FRONT-${4:-master}" | tr '[:lower:]' '[:upper:]')
HostedZoneName=$(echo "$2.cloud.spacenow.com" | tr '[:upper:]' '[:lower:]')

# get ssm parameters from env
echo "Getting SSM Parameters "

DB_USERNAME=$(get_ssm_parameter /$2/SPACENOW/DATABASE_USER)
DB_PASSWORD=$(get_ssm_parameter /rds/spacenow/mysql/MasterUserPassword)
DB_ENDPOINT=$(get_ssm_parameter /$2/SPACENOW/DATABASE_ENDPOINT)
JWT_SECRET=$(get_ssm_parameter /$2/SPACENOW/JWT_SECRET)
S3_BUCKET=$(get_ssm_parameter /$2/SPACENOW/S3_BUCKET)
ACM_CERTIFICATE=$(get_ssm_parameter /$2/ACM_CERTIFICATE)
echo "ENV ${2}"
CF_PARAMS="ParameterKey=ImageUrl,ParameterValue=$3 \
          ParameterKey=ContainerPort,ParameterValue=3000 \
          ParameterKey=StackName,ParameterValue=$2 \
          ParameterKey=SliceName,ParameterValue=$4 \
          ParameterKey=WebsiteURL,ParameterValue=$WEBSITE_URL \
          ParameterKey=Sitename,ParameterValue=$SITENAME \
          ParameterKey=AdminEmail,ParameterValue=$ADMIN_EMAIL \
          ParameterKey=DbUser,ParameterValue=$DB_USERNAME \
          ParameterKey=DbPassword,ParameterValue=$DB_PASSWORD \
          ParameterKey=DbEndpoint,ParameterValue=$DB_ENDPOINT \
          ParameterKey=FixerApiAccessKey,ParameterValue=$FIXER_API_ACCESS_KEY \
          ParameterKey=PaypalHost,ParameterValue=$PAYPAL_HOST \
          ParameterKey=PaypalAppClientId,ParameterValue=$PAYPAL_APP_CLIENT_ID \
          ParameterKey=PaypalAppSecret,ParameterValue=$PAYPAL_APP_SECRET \
          ParameterKey=BraintreeMerchantId,ParameterValue=$BRAINTREE_MERCHANT_ID \
          ParameterKey=BraintreePublicKey,ParameterValue=$BRAINTREE_PUBLIC_KEY \
          ParameterKey=BraintreePrivateKey,ParameterValue=$BRAINTREE_PRIVATE_KEY \
          ParameterKey=MailChimpApi,ParameterValue=$MAILCHIMP_API \
          ParameterKey=MailChimpListId,ParameterValue=$MAILCHIMP_LIST_ID \
          ParameterKey=MailChimpApiKey,ParameterValue=$MAILCHIMP_API_KEY \
          ParameterKey=JwtSecret,ParameterValue=$JWT_SECRET \
          ParameterKey=FacebookAppId,ParameterValue=$FACEBOOK_APP_ID \
          ParameterKey=FacebookAppSecret,ParameterValue=$FACEBOOK_APP_SECRET \
          ParameterKey=FacebookPixelCode,ParameterValue=$FACEBOOK_PIXEL_CODE \
          ParameterKey=GoogleClientId,ParameterValue=$GOOGLE_CLIENT_ID \
          ParameterKey=GoogleClientSecret,ParameterValue=$GOOGLE_CLIENT_SECRET \
          ParameterKey=GoogleTrackingId,ParameterValue=$GOOGLE_TRACKING_ID \
          ParameterKey=GoogleMapApi,ParameterValue=$GOOGLE_MAP_API \
          ParameterKey=GoogleTagManager,ParameterValue=$GOOGLE_TAG_MANAGER \
          ParameterKey=GoogleCaptcha,ParameterValue=$GOOGLE_CAPTCHA \
          ParameterKey=StripeSecretKey,ParameterValue=$STRIPE_SECRET_KEY \
          ParameterKey=SmtpHost,ParameterValue=$SMTP_HOST \
          ParameterKey=SmtpSenderEmail,ParameterValue=$SMTP_SENDER_EMAIL \
          ParameterKey=SmtpPort,ParameterValue=$SMTP_PORT \
          ParameterKey=SmtpLoginEmail,ParameterValue=$SMTP_LOGIN_EMAIL \
          ParameterKey=SmtpLoginPassword,ParameterValue=$SMTP_LOGIN_PASSWORD \
          ParameterKey=SmtpFromName,ParameterValue=$SMTP_FROM_NAME \
          ParameterKey=TwilioAccountSid,ParameterValue=$TWILIO_ACCOUNT_SID \
          ParameterKey=TwilioAuthToken,ParameterValue=$TWILIO_AUTH_TOKEN \
          ParameterKey=TwilioPhoneNumber,ParameterValue=$TWILIO_PHONE_NUMBER \
          ParameterKey=S3Bucket,ParameterValue=$S3_BUCKET \
          ParameterKey=Browser,ParameterValue=$BROWSER \
          ParameterKey=ApiBooking,ParameterValue=$API_BOOKING \
          ParameterKey=ApiAvailabilities,ParameterValue=$API_AVAILABILITIES \
          ParameterKey=ApiCampaings,ParameterValue=$API_CAMPAIGNS \
          ParameterKey=Certificate,ParameterValue=$ACM_CERTIFICATE \
          ParameterKey=HostedZoneName,ParameterValue=$HostedZoneName"
echo "Checking if stack exists ..."
if ! aws cloudformation describe-stacks --region $region --stack-name $stack_name ; then

echo -e "\nStack does not exist, creating ..."
  aws cloudformation create-stack \
    --region $region \
    --stack-name $stack_name \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --template-body file:///$PWD/scripts/spacenow-fe-cf.yml \
    --parameters $CF_PARAMS \



echo "Waiting for stack to be created ..."
  aws cloudformation wait stack-create-complete \
    --region $region \
    --stack-name $stack_name
else
echo -e "\nStack exists, attempting update ..."

  set +e
  update_output=$( aws cloudformation update-stack \
    --region $region \
    --stack-name $stack_name \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --template-body=file:///$PWD/scripts/spacenow-fe-cf.yml \
    --parameters $CF_PARAMS  2>&1)
  status=$?
  set -e

  echo "$update_output"

  if [ $status -ne 0 ] ; then

    # Don't fail for no-op update
    if [[ $update_output == *"ValidationError"* && $update_output == *"No updates"* ]] ; then
      echo -e "\nFinished create/update - no updates to be performed"
      exit 0
    else
      exit $status
    fi

  fi

  echo "Waiting for stack update to complete ..."
  aws cloudformation wait stack-update-complete \
    --region $region \
    --stack-name $stack_name \

fi

echo "Finished create/update successfully!"
