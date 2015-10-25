(ns ^:figwheel-always parinfer.core
  (:require-macros
    [hiccups.core :as hiccups :refer [html]])
  (:require
    [hiccups.runtime]
    [clojure.string :as string]
    [parinfer.vcr-data :as vcr]
    [parinfer.vcr :refer [vcr
                          play-recording!
                          render-controls!]]
    [parinfer.editor :refer [create-editor!
                             create-regular-editor!
                             start-editor-sync!]]
    [parinfer.format.infer :as infer]
    [parinfer.format.prep :as prep]
    [ajax.core :refer [GET]]))

(enable-console-print!)

(defn toc-headers []
  (let [elements (.. js/document
                     (getElementById "app")
                     (querySelectorAll "h2,h3,h4,h5,h6"))]
    (for [i (range (.-length elements))]
      (let [e (aget elements i)]
        {:id (.. e -parentElement -id)
         :level (subs (.-tagName e) 1)
         :text (.-innerText e)}))))

(defn make-toc-html []
  (html
    [:div
     (for [{:keys [id level text]} (toc-headers)]
       [:div {:class (str "toc-link toc-level-" level)}
        [:a {:href (str "#" id)} text]])]))

(defn render-index! []

  ;; create table of contents
  (let [element (js/document.getElementById "toc")
        toc-html (make-toc-html)]
    (set! (.-innerHTML element) toc-html))

  ;; create editors
  #_(create-editor! "code-intro" :intro {:styleActiveLine true})

  (create-editor! "code-indent" :indent)
  (create-editor! "code-indent-far" :indent-far)
  (create-editor! "code-indent-multi" :indent-multi)

  (create-editor! "code-line" :line)
  (create-editor! "code-comment" :comment)
  (create-editor! "code-wrap" :wrap)
  (create-editor! "code-splice" :splice)
  (create-editor! "code-barf" :barf)
  (create-editor! "code-slurp" :slurp)
  (create-editor! "code-string" :string)
  (create-editor! "code-enter" :enter)

  (let [opts {:readOnly true}
        cm-good (create-editor! "code-warn-good" :warn-good opts)
        cm-bad (create-editor! "code-warn-bad" :warn-bad opts)]
    (.refresh cm-good)
    (.refresh cm-bad))

  (create-editor! "code-displaced" :displaced)
  (create-editor! "code-not-displaced" :not-displaced)

  (let [opts {:parinfer-mode :prep}]
    (create-editor! "code-paren-tune" :paren-tune opts)
    (create-editor! "code-paren-frac" :paren-frac opts)
    (create-editor! "code-paren-comment" :paren-comment opts)
    (create-editor! "code-paren-wrap" :paren-wrap opts)) 

  (start-editor-sync!)

  (create-regular-editor! "code-lisp-style")
  (create-regular-editor! "code-c-style")
  (create-regular-editor! "code-skim")
  (create-regular-editor! "code-inspect" {:matchBrackets true})

  (let [cm-input (create-regular-editor! "code-how-input")
        cm-output (create-regular-editor! "code-how-output" {:readOnly true
                                                             :mode "clojure-parinfer"})
        sync! #(.setValue cm-output (infer/format-text (.getValue cm-input)))]
    (.on cm-input "change" sync!)
    (sync!)
    (.refresh cm-input)
    (.refresh cm-output))

  (let [cm-input (create-regular-editor! "code-edit-input")
        cm-output (create-regular-editor! "code-edit-output" {:readOnly true
                                                              :mode "clojure-parinfer"})
        sync! #(.setValue cm-output (or (prep/format-text (.getValue cm-input))
                                        "; ERROR: input must be balanced!"))]
    (.on cm-input "change" sync!)
    (sync!)
    (.refresh cm-input)
    (.refresh cm-output))
    
  ;; create editor animations
  #_(swap! vcr update-in [:intro] merge vcr/intro)
  (swap! vcr update-in [:indent] merge vcr/indent)
  (swap! vcr update-in [:indent-far] merge vcr/indent-far)
  (swap! vcr update-in [:indent-multi] merge vcr/indent-multi)
  (swap! vcr update-in [:line] merge vcr/line)
  (swap! vcr update-in [:wrap] merge vcr/wrap)
  (swap! vcr update-in [:splice] merge vcr/splice)
  (swap! vcr update-in [:barf] merge vcr/barf)
  (swap! vcr update-in [:slurp] merge vcr/slurp-)
  (swap! vcr update-in [:displaced] merge vcr/displaced)
  (swap! vcr update-in [:not-displaced] merge vcr/not-displaced)
  (swap! vcr update-in [:comment] merge vcr/comment-)
  
  (swap! vcr update-in [:string] merge vcr/string)
  (swap! vcr update-in [:warn-bad] merge vcr/warn-bad)
  (swap! vcr update-in [:warn-good] merge vcr/warn-good)
  (swap! vcr update-in [:enter] merge vcr/enter)
  
  (swap! vcr update-in [:paren-tune] merge vcr/paren-tune)
  (swap! vcr update-in [:paren-frac] merge vcr/paren-frac)
  (swap! vcr update-in [:paren-comment] merge vcr/paren-comment)
  (swap! vcr update-in [:paren-wrap] merge vcr/paren-wrap)

  #_(play-recording! :intro)
  (play-recording! :indent)
  (play-recording! :indent-far)
  (play-recording! :indent-multi)
  (play-recording! :line)
  (play-recording! :wrap)
  (play-recording! :splice)
  (play-recording! :barf)
  (play-recording! :slurp)
  (play-recording! :comment)
  (play-recording! :string)
  (play-recording! :warn-good)
  (play-recording! :warn-bad)
  (play-recording! :displaced)
  (play-recording! :not-displaced)
  (play-recording! :enter)
  (play-recording! :paren-tune)
  (play-recording! :paren-frac)
  (play-recording! :paren-comment)
  (play-recording! :paren-wrap)

  (render-controls!))

(defn render-dev! []
  (create-editor! "code-indent-mode" :indent-mode)
  (create-editor! "code-paren-mode" :paren-mode {:parinfer-mode :prep})
  (start-editor-sync!))

(defn init! []
  (if js/window.parinfer_devpage
    (render-dev!)
    (render-index!)))

(init!)
