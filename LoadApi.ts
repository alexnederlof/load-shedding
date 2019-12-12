import axios from 'axios';

export async function getLoadStage() {
  return axios
    .get<number>('http://loadshedding.eskom.co.za/LoadShedding/GetStatus', {
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        Referer: 'https://loadshedding.eskom.co.za/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
    .then(({ data: stage }) => stage - 1);
}

export async function getSchedule() {
  return axios.get<ScheduleResponse>(
    'https://ewn.co.za/assets/loadshedding/api/schedulesctfeb2015',
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:71.0) Gecko/20100101 Firefox/71.0',
        Accept: '*/*',
        'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
        'X-Requested-With': 'XMLHttpRequest',
        referrer: 'https://ewn.co.za/assets/loadshedding/capetown.html',
      },
    }
  );
}

export async function getScheduleForZone(zone: number, stage: number) {
  const { data: schedule } = await getSchedule();
  const schedules = schedule.Schedules.filter(
    s => Number(s.Stage) === stage && s.Zones.includes(zone)
  ).map(schedule => {
    // console.log("Old schedule " , schedule)
    let dateWithoutTime = schedule.Date.toString();
    dateWithoutTime = dateWithoutTime.substring(0, dateWithoutTime.indexOf('T') + 1);
    const begin = new Date(dateWithoutTime + schedule.StartTime + '+02:00');
    const end = new Date(dateWithoutTime + schedule.EndTime + '+02:00');
    return { begin, end };
  });

  return {
    LastModified: schedule.LastModified,
    Schedules: schedules,
  };
}

export interface Day {
  DayNumber: number;
  DayString: string;
  DayStringShort: string;
  Date: string;
}

export interface Schedule {
  Stage: string;
  Day: number;
  Date: Date;
  DateShort: string;
  StartTime: string;
  EndTime: string;
  Zones: number[];
}

export interface ScheduleStageMapping {
  Stage: string;
  Schedules: Schedule[];
}

export interface Timeframe {
  Start: string;
  End: string;
  ScheduleStageMappings: ScheduleStageMapping[];
}

export interface ScheduleResponse {
  LastModified: string;
  Days: Day[];
  Schedules: Schedule[];
  Timeframes: Timeframe[];
}
