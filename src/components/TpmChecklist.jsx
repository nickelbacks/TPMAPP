import React, { useState } from 'react';
import { nextId, saveDB } from '../db.js';
import { Camera } from 'lucide-react';

function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const scale = Math.min(1, 900 / img.width);
        c.width = img.width * scale;
        c.height = img.height * scale;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function TpmChecklist({ machine, currentUser, DB, persist, trk, go, onClose }) {
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [error, setError] = useState(false);

  const setAns = (taskId, val) => {
    setAnswers(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: val } }));
    setError(false);
  };

  const setCommentTask = (taskId, text) => {
    setAnswers(prev => ({ ...prev, [taskId]: { ...prev[taskId], comment: text } }));
  };

  const setPhoto = async (taskId, file) => {
    const url = await resizeImage(file);
    setAnswers(prev => ({ ...prev, [taskId]: { ...prev[taskId], photo: url } }));
  };

  const submit = () => {
    const missing = machine.checklist.some(t => !answers[t.id] || !answers[t.id].status);
    if (missing) { setError(true); return; }

    const newDB = { ...DB };
    newDB.records = [...newDB.records, {
      id: nextId(),
      machineId: machine.id,
      userId: currentUser.id,
      date: Date.now(),
      results: machine.checklist.map(t => ({
        taskId: t.id,
        status: answers[t.id].status,
        comment: answers[t.id].comment || '',
        photo: answers[t.id].photo || null,
      })),
      comment: comment.trim(),
    }];
    trk('action', { type: 'tpm' });
    persist(newDB);
    onClose();
    go('machine', machine.id);
  };

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <h3>TPM — {machine.name}</h3>
      <div className="modal-sub">{today} — par {currentUser.name}</div>

      {machine.checklist.map((t, i) => {
        const ans = answers[t.id] || {};
        return (
          <div key={t.id} className="ck-task">
            <div className="ck-head">
              <div className="ck-label">{i + 1}. {t.label}</div>
              <div className="oknok">
                <button
                  className={ans.status === 'ok' ? 'sel-ok' : ''}
                  onClick={() => setAns(t.id, 'ok')}
                >OK</button>
                <button
                  className={ans.status === 'nok' ? 'sel-nok' : ''}
                  onClick={() => setAns(t.id, 'nok')}
                >NOK</button>
              </div>
            </div>
            {ans.status === 'nok' && (
              <div className="ck-extra">
                <textarea
                  placeholder="Décrivez l'anomalie…"
                  value={ans.comment || ''}
                  onChange={(e) => setCommentTask(t.id, e.target.value)}
                />
                <label className="btn btn-ghost photo-btn">
                  <Camera size={16} /> Ajouter une photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden-input"
                    onChange={(e) => { if (e.target.files[0]) setPhoto(t.id, e.target.files[0]); }}
                  />
                </label>
                {ans.photo && <img src={ans.photo} className="photo-preview" alt="" />}
              </div>
            )}
          </div>
        );
      })}

      <label>Commentaire général (optionnel)</label>
      <textarea
        placeholder="Remarques…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {error && <div className="modal-error">Merci de répondre OK ou NOK à toutes les tâches.</div>}

      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary" onClick={submit}>Valider la TPM</button>
      </div>
    </>
  );
}
