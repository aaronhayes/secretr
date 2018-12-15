#
# Starts development envrionment
# 
# --------
# @package: @secretr
# @author: Aaron Hayes (aaron.hayes92@gmail.com)
# @since: 16-December-2018
#
echo 'Starting docker-compose ...'
docker-compose up --force-recreate >/dev/null 2>&1 &

# Wait for SQS to become available
echo 'Wait for hosts ...'
sleep 10
node ./scripts/wait-for-host localhost:4576

if [ $? -eq 0 ]; then
  # Init SQS Queues
  (cd backend && yarn init:sqs)
  # Start Serverless Functions
  echo 'Starting backend ...'
  (cd backend && yarn start)
else
  echo 'Could not get hosts!'
  exit 1
fi