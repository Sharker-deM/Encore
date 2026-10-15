import test from 'node:test';
import assert from 'node:assert/strict';
import {dayInZone,daysUntil,reminderDue,savingsDue,providerCheckDue,differences,summary} from '../api/_monitor-logic.mjs';
import {parseTM,parseTK} from '../api/_monitor-sources.mjs';

test('Brisbane day and leap-safe day arithmetic',()=>{
 assert.equal(dayInZone(new Date('2026-10-14T22:15:00Z')),'2026-10-15');
 assert.equal(daysUntil('2026-11-27','2026-11-24'),3);
});
test('daily countdown begins on specified lead and stops after show',()=>{
 const c={date:'2026-11-27',reminderMode:'daily',reminderDays:14};
 assert.equal(reminderDue(c,'2026-11-12'),false);
 assert.equal(reminderDue(c,'2026-11-13'),true);
 assert.equal(reminderDue(c,'2026-11-27'),true);
 assert.equal(reminderDue(c,'2026-11-28'),false);
});
test('once only on chosen day, weekly includes the final day',()=>{
 const c={date:'2026-11-27',reminderMode:'once',reminderDays:3};
 assert.equal(reminderDue(c,'2026-11-24'),true);
 assert.equal(reminderDue(c,'2026-11-25'),false);
 c.reminderMode='weekly';c.reminderDays=21;
 assert.equal(reminderDue(c,'2026-11-06'),true);
 assert.equal(reminderDue(c,'2026-11-13'),true);
 assert.equal(reminderDue(c,'2026-11-27'),true);
 assert.equal(reminderDue(c,'2026-11-21'),false);
});
test('cancelled / archived / postponed do not receive countdowns',()=>{
 const c={date:'2026-11-27',reminderMode:'daily',reminderDays:30};
 for(const status of ['cancelled','postponed']){c.status=status;assert.equal(reminderDue(c,'2026-11-17'),false)}
 c.status='scheduled';c.archived=true;assert.equal(reminderDue(c,'2026-11-17'),false);
});
test('savings reminder opt-in and completed goal ignored',()=>{
 const c={date:'2026-11-27',frequency:'daily',target:120,deposits:[{amount:75}]};
 assert.equal(savingsDue(c,'2026-11-22'),false);
 c.savingsAlerts=true;assert.equal(savingsDue(c,'2026-11-22'),true);
 c.deposits.push({amount:45});assert.equal(savingsDue(c,'2026-11-22'),false);
});
test('never erase known details when provider omits a field',()=>{
 const before={date:'2026-11-27',venue:'Marvel Stadium',time:'19:00',status:'scheduled'};
 const newInfo={date:'2026-11-28',venue:'',time:'',status:'cancelled'};
 assert.deepEqual(differences(before,newInfo).map(x=>x.field),['date','status']);
 assert.match(summary(differences(before,newInfo)),/Date/);
});
test('new support-act and headliner times are detected',()=>{
 const before={date:'2026-11-27',venue:'Arena'};
 const now={date:'2026-11-27',venue:'Arena',supportActs:'Band A',headlineTime:'20:30'};
 assert.deepEqual(differences(before,now).map(x=>x.field),['headlineTime','supportActs']);
});
test('Ticketmaster ignores TBA clock but captures cancellation',()=>{
 const x=parseTM({dates:{start:{localDate:'2026-11-27',localTime:'19:00:00',noSpecificTime:true},status:{code:'cancelled'}},_embedded:{venues:[{name:'Marvel Stadium',city:{name:'Docklands'}}]}});
 assert.equal(x.date,'2026-11-27');assert.equal(x.time,'');assert.equal(x.status,'cancelled');assert.equal(x.city,'Docklands');
});
test('Ticketek nested parser response can normalise event fields',()=>{
 const x=parseTK({status:'success',data:{title:'Show',start_date:'2026-12-12',start_time:'20:00',venue:'Venue A',suburb:'Brisbane',state:'QLD'}});
 assert.equal(x.date,'2026-12-12');assert.equal(x.venue,'Venue A');
});

test('Ticketek parser checks are credit-conscious while far away',()=>{
 const c={date:'2026-11-27',provider:'ticketek',link:'https://premier.ticketek.com.au/shows/show.aspx?sh=TEST'};
 assert.equal(providerCheckDue(c,'2026-10-15'),false); // 43 days ahead
 assert.equal(providerCheckDue(c,'2026-10-16'),true); // 42 days ahead
 assert.equal(providerCheckDue(c,'2026-11-24'),true); // 3 days ahead
 c.provider='ticketmaster';c.eventId='abc';assert.equal(providerCheckDue(c,'2026-10-15'),true);
});
