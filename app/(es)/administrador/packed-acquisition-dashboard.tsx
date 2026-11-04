'use client';
import {useMemo} from 'react';
import {AcquisitionDashboard} from './acquisition-dashboard';
import {unpackAcquisition,type PackedDashboardSnapshot} from './packed-dashboard-transport';

export function PackedAcquisitionDashboard({data}:{data:PackedDashboardSnapshot}){
 const decoded=useMemo(()=>unpackAcquisition(data),[data]);
 return <AcquisitionDashboard data={decoded}/>;
}
