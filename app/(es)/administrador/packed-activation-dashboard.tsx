'use client';
import {useMemo} from 'react';
import {ActivationDashboard} from './activation-dashboard';
import {unpackActivation,type PackedDashboardSnapshot} from './packed-dashboard-transport';

export function PackedActivationDashboard({data}:{data:PackedDashboardSnapshot}){
 const decoded=useMemo(()=>unpackActivation(data),[data]);
 return <ActivationDashboard data={decoded}/>;
}
