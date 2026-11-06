import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyCreemWebhookSignature } from '../lib/payments/creem.ts';
import { isCreemModeEnabled, CREEM_USD_MONTHLY_CENTS } from '../lib/payments/creem-international.ts';
import { reconcileCreemBillingEvent } from '../lib/payments/creem-reconcile.ts';

assert.equal(CREEM_USD_MONTHLY_CENTS,999);
const initial = {
  VERCEL_ENV:process.env.VERCEL_ENV,
  CREEM_INTERNATIONAL_ENABLED:process.env.CREEM_INTERNATIONAL_ENABLED,
  CREEM_LIVE_PRODUCT_ID:process.env.CREEM_LIVE_PRODUCT_ID,
  CREEM_LIVE_API_KEY:process.env.CREEM_LIVE_API_KEY,
  CREEM_LIVE_WEBHOOK_SECRET:process.env.CREEM_LIVE_WEBHOOK_SECRET,
};
try {
  process.env.VERCEL_ENV = 'production';
  process.env.CREEM_INTERNATIONAL_ENABLED = 'false';
  process.env.CREEM_LIVE_API_KEY = 'creem_live_mock';
  process.env.CREEM_LIVE_PRODUCT_ID = 'prod_mocklive';
  process.env.CREEM_LIVE_WEBHOOK_SECRET = 'mock_secret';
  assert.equal(isCreemModeEnabled('test'),false);
  assert.equal(isCreemModeEnabled('live'),false);
  process.env.CREEM_INTERNATIONAL_ENABLED = 'true';
  assert.equal(isCreemModeEnabled('live'),true);
  const body = JSON.stringify({id:'evt_fake',eventType:'subscription.paid'});
  assert.equal(verifyCreemWebhookSignature(body,'0'.repeat(64),'secret'),false);

  type Row = Record<string,unknown>;
  const db: Record<string,Row[]> = {
    creem_checkout_sessions: [], user_subscriptions: [], payment_transactions: [],
  };
  function fakeClient(): SupabaseClient {
    return {
      from(table: string) {
        let op: 'read' | 'update' = 'read';
        let modifications: Row = {};
        const filters: Array<[string,unknown]> = [];
        const matches = (row: Row) => filters.every(([key,value])=>row[key]===value);
        const run = () => {
          if (op === 'update') {
            const found = (db[table] || []).filter(matches);
            for (const row of found) Object.assign(row,modifications);
            return {data:found,error:null};
          }
          return {data:(db[table]||[]).filter(matches),error:null};
        };
        const chain = {
          select(_columns: string) { return chain; },
          eq(key:string,value:unknown) { filters.push([key,value]); return chain; },
          maybeSingle() { const results=run().data; return Promise.resolve({data:results[0]??null,error:null}); },
          update(values:Row) { op='update'; modifications=values; return chain; },
          insert(values:Row) { (db[table] ||= []).push({...values,id:values.id||'uuid_internal'}); return Promise.resolve({data:null,error:null}); },
          upsert(values:Row) {
            const entries=db[table] ||= [];
            const match=entries.find(r=>r.provider===values.provider && r.provider_payment_id===values.provider_payment_id);
            if(match)Object.assign(match,values);else entries.push({...values,id:values.id||'uuid_internal'});
            return Promise.resolve({data:null,error:null});
          },
          then(resolve:(v:{data:Row[];error:null})=>unknown,reject?:unknown) { return Promise.resolve(run()).then(resolve,reject as never); },
        };
        return chain;
      },
    } as unknown as SupabaseClient;
  }
  const client=fakeClient();
  const attempt='123e4567-e89b-42d3-a456-426614174000';
  const uid='123e4567-e89b-42d3-a456-426614174001';
  const product='prod_mocklive';
  const checkoutId='ch_mock_checkout_1234';
  const subscriptionId='sub_mock_subscription_1234';
  const baseTime=Date.now();
  const end=new Date(baseTime+30*24*60*60_000).toISOString();
  const order={status:'paid',currency:'USD',amount:999,product};
  const checkout={
    id:'evt_mock_checkout_1234',eventType:'checkout.completed',created_at:baseTime,
    object:{
      id:checkoutId,mode:'live',request_id:attempt,status:'completed',order,
      product:{id:product},subscription:{id:subscriptionId},
      metadata:{userId:uid,attemptId:attempt},
    },
  };
  const paid={
    id:'evt_mock_paid_1234',eventType:'subscription.paid',created_at:baseTime+1000,
    object:{
      id:subscriptionId,mode:'live',status:'active',
      product:{id:product,currency:'USD',price:999},
      last_transaction_id:'tran_mock_payment_1234',
      last_transaction_date:new Date(baseTime+1000).toISOString(),
      current_period_end_date:end,
    },
  };
  const newSession=(mode:string)=>({
    id:attempt,user_id:uid,plan_id:'premium-plan-test',mode,product_id:product,
    currency:'USD',expected_amount_cents:999,status:'pending',
    checkout_id:checkoutId,subscription_id:null,current_period_end:null,last_event_at:null,
  });
  db.creem_checkout_sessions.push(newSession('live'));
  await assert.rejects(reconcileCreemBillingEvent(client,'live',paid),/unmatched_paid/);
  assert.equal(await reconcileCreemBillingEvent(client,'live',checkout),'processed');
  assert.equal(db.user_subscriptions.length,0,'checkout completed alone never grants Premium');
  assert.equal(await reconcileCreemBillingEvent(client,'live',paid),'processed');
  assert.equal(db.user_subscriptions.length,1);
  assert.equal(db.user_subscriptions[0].payment_provider,'creem');
  assert.equal(db.user_subscriptions[0].amount_ars,null);
  assert.equal(db.user_subscriptions[0].expires_at,end);
  assert.equal(db.payment_transactions.length,1);
  assert.equal(db.payment_transactions[0].currency,'USD');
  assert.equal(db.payment_transactions[0].amount_ars,null);
  const canceled={
    id:'evt_mock_cancel_1234',eventType:'subscription.canceled',created_at:baseTime+2000,
    object:{id:subscriptionId,mode:'live',product:{id:product},
      status:'canceled',current_period_end_date:end},
  };
  assert.equal(await reconcileCreemBillingEvent(client,'live',canceled),'processed');
  assert.equal(db.user_subscriptions[0].status,'canceled');
  assert.equal(db.user_subscriptions[0].expires_at,end);
  const refund={
    id:'evt_mock_refund_1234',eventType:'refund.created',created_at:baseTime+3000,
    object:{id:'ref_mock_refund_1234',status:'succeeded',subscription:{id:subscriptionId}},
  };
  assert.equal(await reconcileCreemBillingEvent(client,'live',refund),'processed');
  assert.equal(db.user_subscriptions[0].status,'refunded');
  assert.ok(Date.parse(String(db.user_subscriptions[0].expires_at)) <= Date.now()+10000);
  assert.equal(await reconcileCreemBillingEvent(client,'live',paid),'ignored','old payment event cannot revive refunded access');

  // A completely separate test-mode simulation cannot touch canonical Premium.
  db.creem_checkout_sessions.splice(0,db.creem_checkout_sessions.length,newSession('test'));
  db.user_subscriptions.splice(0);
  db.payment_transactions.splice(0);
  process.env.VERCEL_ENV='preview';
  process.env.CREEM_API_KEY='creem_test_mock';
  process.env.CREEM_WEBHOOK_SECRET='test_secret_mock';
  const testCheckout={...checkout,object:{...checkout.object,mode:'test',product:{id:'prod_1pkc1Tr6BooFlGMCKcXWB0'},
    order:{...order,product:'prod_1pkc1Tr6BooFlGMCKcXWB0'}}};
  db.creem_checkout_sessions[0].product_id='prod_1pkc1Tr6BooFlGMCKcXWB0';
  assert.equal(await reconcileCreemBillingEvent(client,'test',testCheckout),'processed');
  const testPaid={...paid,object:{...paid.object,mode:'test',product:{
    id:'prod_1pkc1Tr6BooFlGMCKcXWB0',currency:'USD',price:999,
  }}};
  assert.equal(await reconcileCreemBillingEvent(client,'test',testPaid),'processed');
  assert.equal(db.user_subscriptions.length,0);
  assert.equal(db.payment_transactions.length,0);

  const liveRoute=readFileSync('app/api/webhooks/creem-live/route.ts','utf8');
  const testRoute=readFileSync('app/api/webhooks/creem/route.ts','utf8');
  assert.match(liveRoute,/CREEM_LIVE_WEBHOOK_SECRET/);
  assert.match(liveRoute,/reconcileCreemBillingEvent\(admin,'live',payload\)/);
  assert.match(testRoute,/reconcileCreemBillingEvent\(admin, 'test', payload\)/);
  assert.match(testRoute,/VERCEL_ENV === 'production'/);
  const oldCard=readFileSync('components/pricing/PaymentCheckoutCard.tsx','utf8');
  assert.match(oldCard,/expectedBaseAmountArs: displayedPrice/);
  console.log('Creem USD: sandbox isolation, signed live payment, renewal, cancellation, refund, replay passed.');
} finally {
  for(const [key,value] of Object.entries(initial)) {
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
  delete process.env.CREEM_API_KEY;
  delete process.env.CREEM_WEBHOOK_SECRET;
}
