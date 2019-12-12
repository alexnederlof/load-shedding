import * as ics from 'ics';
import { getLoadStage, getScheduleForZone } from './LoadApi';

import {
  Callback,
  Context,
  Handler,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

interface HelloResponse {
  statusCode: number;
  body: string;
}


const asJson: APIGatewayProxyHandler = async (
    request: APIGatewayProxyEvent,
    context: Context,
    callback: Callback<APIGatewayProxyResult>
  ) => {
  const stage = await getLoadStage();
  console.log('Load stage is ' + stage);
  const schedule = await getScheduleForZone(14, stage);
  console.log('Got schedule', schedule);
  return {
    statusCode: 200,
    body: JSON.stringify(schedule),
  };
};

const asCalendar: APIGatewayProxyHandler = async (
  request: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
) => {
  const region = Number(request.queryStringParameters?.region) || 14;
  const stage = await getLoadStage();
  console.log('Load stage is ' + stage);
  const schedule = await getScheduleForZone(region, stage);
  console.log('Got schedule', schedule);
  const events: ics.EventAttributes[] = schedule.Schedules.map(s => {
    return {
      title: '⚡️ Load Shedding  ⚡️',
      description: `At stage ${stage} for region 14. #TIA`,
      startInputType: 'utc',
      url: 'https://ewn.co.za/assets/loadshedding/capetown.html',
      status: 'CONFIRMED',
      busyStatus: 'FREE',
      start: dateToArray(s.begin),
      duration: { minutes: (s.end.getTime() / 1000 - s.begin.getTime() / 1000) / 60 },
      alarms: [{
          action: 'audio' as ics.ActionType,
          trigger: {
              minutes: 15,
              before: true
          }
      }]
    };
  });
  const event = await new Promise<string>((onSuccess, onError) => {
    ics.createEvents(events, (error, value) => {
      if (error) {
        onError(error);
      } else {
        onSuccess(value);
      }
    });
  });

  return {
    statusCode: 200,
    body: event,
  };
};

function dateToArray(date: Date): ics.DateArray {
    return [
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
      ]
}

export { asJson, asCalendar };
