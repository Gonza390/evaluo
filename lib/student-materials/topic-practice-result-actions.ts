/**
 * La pantalla de resultados por tema muestra sólo dos acciones relevantes.
 * Las acciones dependen de errores detectados EN ESTA tanda y de si queda otro tema.
 */
export type TopicPracticeResultAction = 'reinforce' | 'next_topic' | 'all_topics' | 'retry';

export function topicPracticeResultActions(
  hasErrors: boolean,
  hasNextTopic: boolean
): readonly [TopicPracticeResultAction, TopicPracticeResultAction] {
  if (hasErrors) return ['reinforce', hasNextTopic ? 'next_topic' : 'all_topics'];
  return [hasNextTopic ? 'next_topic' : 'all_topics', 'retry'];
}
